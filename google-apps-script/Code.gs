/**
 * Personnel Travel calendar JSON endpoint.
 *
 * Before deployment, open Project Settings > Script properties and add:
 *   ACCESS_CODE: a long random value you also put in the React .env.local file
 *   CALENDAR_ID: primary, or a shared calendar's Calendar ID (optional)
 *   PERSONNEL_EMAILS: JSON object mapping personnel names to email addresses
 *     Example: {"Albert Rio":"albert@example.com","Clifford Jay":"clifford@example.com"}
 * Also add the Google Calendar API and Gmail API under Services in the Apps Script editor.
 */
const DEFAULT_PERSONNEL_EMAILS = {
  'Albert Rio': 'atrinidad@ched.gov.ph',
  'Clifford Jay': 'cjimenez@ched.gov.ph',
  'Czharlyz Nicole': 'cnmanalang@ched.gov.ph',
  'Duke Vincent Paul': 'dvpdayata@ched.gov.ph',
  'Ian Christopher': 'icmangubat@ched.gov.ph',
  'Atty.Lisha': 'lvillacanas@ched.gov.ph',
  'Marc Anthony': 'maespiritu@ched.gov.ph',
  'Marvin Harrould': 'mhkho@ched.gov.ph',
  'Regine Mae': 'rmgonzales@ched.gov.ph',
  'Von Francis': 'vflavictoria@ched.gov.ph'
};

/**
 * Run this once from the Apps Script editor to authorize Gmail sending.
 * After permission is granted, a confirmation email is sent to the account
 * executing the script.
 */
function authorizeGmailSending() {
  const recipient = Session.getEffectiveUser().getEmail();
  if (!recipient) {
    throw new Error('Apps Script could not determine the executing account email address.');
  }
  sendGmailItinerary(
    recipient,
    'Personnel Travel System: Gmail authorization successful',
    'Gmail sending is now authorized for the Personnel Travel System.',
    '<p>Gmail sending is now authorized for the <strong>Personnel Travel System</strong>.</p>'
  );
  return 'Authorization successful. Confirmation email sent to ' + recipient;
}

function doGet(request) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedCode = properties.getProperty('ACCESS_CODE');
    const suppliedCode = request && request.parameter && request.parameter.code;

    if (!expectedCode || suppliedCode !== expectedCode) {
      return jsonResponse({ ok: false, error: 'Unauthorized request.' });
    }

    const calendarId = properties.getProperty('CALENDAR_ID') || 'primary';
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start = request.parameter.timeMin ? new Date(request.parameter.timeMin) : defaultStart;
    const end = request.parameter.timeMax ? new Date(request.parameter.timeMax) : defaultEnd;
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ ok: false, error: 'The requested calendar range is invalid.' });
    }
    const calendarInfo = Calendar.Calendars.get(calendarId);
    const calendarColors = Calendar.Colors.get();
    let calendarListEntry = {};
    try {
      calendarListEntry = Calendar.CalendarList.get(calendarId);
    } catch (calendarListError) {
      // Event colors can still be shown if the calendar-list entry is unavailable.
    }
    const result = Calendar.Events.list(calendarId, {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      maxResults: 500,
      fields: 'items(iCalUID,id,summary,location,description,extendedProperties/private,status,start,end,colorId)'
    });
    const events = (result.items || []).map(function(event) {
      const privateData = event.extendedProperties && event.extendedProperties.private || {};
      const description = event.description || '';
      const notesMatch = description.match(/(?:^|\n)Notes:\s*([^\n]*)/i);
      const assignmentNotes = privateData.assignmentNotes || (notesMatch ? notesMatch[1].trim() : '');
      const personnelMatch = description.match(/(?:^|\n)Personnel:\s*([^\n]*)/i);
      const withLines = description
        .split(/\r?\n/)
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return /^WITH\s+/i.test(line); });
      // Calendar descriptions can contain contextual lines such as "With CJ"
      // before the actual assignment. The final WITH line is the saved personnel.
      const withPersonnel = withLines.length
        ? withLines[withLines.length - 1].replace(/^WITH\s+/i, '')
        : '';
      const descriptionPersonnel = personnelMatch
        ? personnelMatch[1].trim()
        : withPersonnel
          ? withPersonnel.split(/\s+AND\s+/i).map(function(name) { return name.trim(); }).filter(Boolean).join(', ')
          : '';
      const eventColor = event.colorId && calendarColors.event
        ? calendarColors.event[event.colorId]
        : null;
      const fallbackColor = calendarListEntry.backgroundColor
        ? {
            background: calendarListEntry.backgroundColor,
            foreground: calendarListEntry.foregroundColor || '#ffffff'
          }
        : calendarListEntry.colorId && calendarColors.calendar
          ? calendarColors.calendar[calendarListEntry.colorId]
          : null;
      return {
        // CalendarApp expects the iCalendar UID when an assignment is saved.
        id: event.iCalUID || event.id,
        summary: event.summary || 'Untitled event',
        location: event.location || '',
        // Preserve the source description so the client can also recover legacy
        // assignments when an extended property is unavailable.
        description: description,
        personnel: privateData.personnel || descriptionPersonnel,
        assignmentNotes: assignmentNotes,
        guests: [],
        status: event.status || 'confirmed',
        colorId: event.colorId || '',
        color: eventColor || fallbackColor,
        start: event.start || {},
        end: event.end || {}
      };
    });

    const response = {
      ok: true,
      calendarName: calendarInfo.summary || calendarId,
      timeZone: calendarInfo.timeZone || Session.getScriptTimeZone(),
      events: events
    };
    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function doPost(request) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedCode = properties.getProperty('ACCESS_CODE');
    const values = request && request.parameter ? request.parameter : {};

    if (!expectedCode || values.code !== expectedCode) {
      return jsonResponse({ ok: false, error: 'Unauthorized request.' });
    }
    const calendarId = properties.getProperty('CALENDAR_ID') || 'primary';
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);
    if (!calendar) return jsonResponse({ ok: false, error: 'Calendar was not found.' });

    if (values.action === 'delete') {
      if (!values.eventId) {
        return jsonResponse({ ok: false, error: 'Calendar event is required.' });
      }
      const eventToDelete = findCalendarEvent(calendar, values.eventId, values.eventStart);
      if (!eventToDelete) {
        return jsonResponse({ ok: false, error: 'The selected calendar event was not found.' });
      }
      eventToDelete.deleteEvent();
      return jsonResponse({
        ok: true,
        id: values.eventId,
        message: 'Calendar event deleted.'
      });
    }

    if (values.action === 'assign') {
      if (!values.eventId || !values.personnel) {
        return jsonResponse({ ok: false, error: 'Calendar event and personnel are required.' });
      }
      let assignedEvent = calendar.getEventById(values.eventId);
      if (values.eventStart) {
        const selectedStart = new Date(values.eventStart);
        const searchStart = new Date(selectedStart.getTime() - 60000);
        const searchEnd = new Date(selectedStart.getTime() + 60000);
        const matchingEvents = calendar.getEvents(searchStart, searchEnd).filter(function(event) {
          return event.getId() === values.eventId && event.getStartTime().getTime() === selectedStart.getTime();
        });
        if (matchingEvents.length) assignedEvent = matchingEvents[0];
      }
      if (!assignedEvent) return jsonResponse({ ok: false, error: 'The selected calendar event was not found.' });

      assignedEvent.setTag('personnel', values.personnel);
      assignedEvent.setTag('assignmentNotes', values.notes || '');
      const legacyMarker = '\n\n--- Personnel Travel Assignment ---';
      let originalDescription = assignedEvent.getTag('originalDescription');
      if (assignedEvent.getTag('assignmentManaged') !== 'true') {
        originalDescription = (assignedEvent.getDescription() || '').split(legacyMarker)[0];
        assignedEvent.setTag('originalDescription', originalDescription);
        assignedEvent.setTag('assignmentManaged', 'true');
      }

      const names = values.personnel
        .split(',')
        .map(function(name) { return name.trim().toUpperCase(); })
        .filter(Boolean);
      const assignmentLines = [
        'WITH ' + names.join(' AND '),
        values.notes ? 'Notes: ' + values.notes : ''
      ].filter(Boolean);
      const updatedDescription = [originalDescription, assignmentLines.join('\n')]
        .filter(Boolean)
        .join('\n\n');
      assignedEvent.setDescription(updatedDescription);
      const emailResult = sendItineraryEmails(assignedEvent, values.personnel, values.notes || '', properties, calendar);
      return jsonResponse({
        ok: true,
        id: assignedEvent.getId(),
        message: 'Personnel assigned to calendar event.',
        email: emailResult
      });
    }

    if (!values.title || !values.start || !values.end || !values.personnel) {
      return jsonResponse({ ok: false, error: 'Title, personnel, start, and end are required.' });
    }

    const start = new Date(values.start);
    const end = new Date(values.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ ok: false, error: 'The travel date or time range is invalid.' });
    }

    const description = [
      'Personnel: ' + values.personnel,
      values.purpose ? 'Purpose: ' + values.purpose : '',
      values.notes ? 'Notes: ' + values.notes : ''
    ].filter(Boolean).join('\n');

    const event = calendar.createEvent(values.title, start, end, {
      location: values.location || '',
      description: description
    });
    event.setTag('personnel', values.personnel);
    if (values.personnelEmail) event.addGuest(values.personnelEmail);

    return jsonResponse({ ok: true, id: event.getId(), message: 'Travel schedule created.' });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function findCalendarEvent(calendar, eventId, eventStart) {
  let calendarEvent = calendar.getEventById(eventId);
  if (!eventStart) return calendarEvent;

  const selectedStart = new Date(eventStart);
  if (isNaN(selectedStart.getTime())) return null;
  const searchStart = new Date(selectedStart.getTime() - 60000);
  const searchEnd = new Date(selectedStart.getTime() + 60000);
  const matchingEvents = calendar.getEvents(searchStart, searchEnd).filter(function(event) {
    return event.getId() === eventId && event.getStartTime().getTime() === selectedStart.getTime();
  });
  return matchingEvents.length ? matchingEvents[0] : calendarEvent;
}

function sendItineraryEmails(event, personnelValue, assignmentNotes, properties, calendar) {
  const names = String(personnelValue || '')
    .split(',')
    .map(function(name) { return name.trim(); })
    .filter(Boolean);
  const directoryValue = properties.getProperty('PERSONNEL_EMAILS');
  let directory = Object.assign({}, DEFAULT_PERSONNEL_EMAILS);
  try {
    if (directoryValue) {
      const configuredDirectory = JSON.parse(directoryValue);
      Object.keys(configuredDirectory).forEach(function(name) {
        const email = String(configuredDirectory[name] || '').trim();
        if (email) directory[name] = email;
      });
    }
  } catch (error) {
    return { sent: [], missing: names, failed: [], error: 'PERSONNEL_EMAILS is not valid JSON.' };
  }

  const emailsByName = {};
  Object.keys(directory).forEach(function(name) {
    emailsByName[normalizePersonnelKey(name)] = String(directory[name] || '').trim();
  });

  const timeZone = calendar.getTimeZone() || Session.getScriptTimeZone();
  const dateFormat = event.isAllDayEvent() ? 'EEEE, MMMM d, yyyy' : 'EEEE, MMMM d, yyyy h:mm a';
  const start = Utilities.formatDate(event.getStartTime(), timeZone, dateFormat);
  const end = Utilities.formatDate(event.getEndTime(), timeZone, dateFormat);
  const subject = 'Travel Itinerary: ' + event.getTitle();
  const sent = [];
  const missing = [];
  const failed = [];

  names.forEach(function(name) {
    const email = emailsByName[normalizePersonnelKey(name)];
    if (!email) {
      missing.push(name);
      return;
    }
    const textBody = [
      'Hello ' + name + ',',
      '',
      'Here is your official travel itinerary:',
      'Travel: ' + event.getTitle(),
      'Start: ' + start,
      'End: ' + end,
      'Location: ' + (event.getLocation() || 'Not specified'),
      assignmentNotes ? 'Notes: ' + assignmentNotes : '',
      '',
      'This is an automated message from the Personnel Travel System.'
    ].filter(Boolean).join('\n');
    const htmlBody = [
      '<p>Hello ' + escapeHtml(name) + ',</p>',
      '<p>Here is your official travel itinerary:</p>',
      '<table style="border-collapse:collapse">',
      itineraryRow('Travel', event.getTitle()),
      itineraryRow('Start', start),
      itineraryRow('End', end),
      itineraryRow('Location', event.getLocation() || 'Not specified'),
      assignmentNotes ? itineraryRow('Notes', assignmentNotes) : '',
      '</table>',
      '<p style="color:#667085;font-size:12px">This is an automated message from the Personnel Travel System.</p>'
    ].join('');
    try {
      sendGmailItinerary(email, subject, textBody, htmlBody);
      sent.push(name);
    } catch (error) {
      failed.push({ name: name, error: error.message || String(error) });
    }
  });

  return { sent: sent, missing: missing, failed: failed };
}

function sendGmailItinerary(recipient, subject, textBody, htmlBody) {
  const boundary = 'personnel_travel_' + Utilities.getUuid().replace(/-/g, '');
  const encodedSubject = '=?UTF-8?B?' + Utilities.base64Encode(subject, Utilities.Charset.UTF_8) + '?=';
  const encodedText = Utilities.base64Encode(textBody, Utilities.Charset.UTF_8);
  const encodedHtml = Utilities.base64Encode(htmlBody, Utilities.Charset.UTF_8);
  const mimeMessage = [
    'To: ' + recipient,
    'Subject: ' + encodedSubject,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedText,
    '--' + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
    '--' + boundary + '--'
  ].join('\r\n');

  Gmail.Users.Messages.send({
    raw: Utilities.base64EncodeWebSafe(mimeMessage, Utilities.Charset.UTF_8)
  }, 'me');
}

function normalizePersonnelKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function itineraryRow(label, value) {
  return '<tr><th style="border:1px solid #d0d5dd;padding:8px;text-align:left;background:#f2f4f7">' +
    escapeHtml(label) + '</th><td style="border:1px solid #d0d5dd;padding:8px">' +
    escapeHtml(value) + '</td></tr>';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
