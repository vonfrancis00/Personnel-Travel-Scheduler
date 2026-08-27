/**
 * Personnel Travel calendar JSON endpoint.
 *
 * Before deployment, open Project Settings > Script properties and add:
 *   ACCESS_CODE: a long random value you also put in the React .env.local file
 *   CALENDAR_ID: primary, or a shared calendar's Calendar ID (optional)
 * Also add the Google Calendar API under Services in the Apps Script editor.
 */
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
    const result = Calendar.Events.list(calendarId, {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      maxResults: 500,
      fields: 'items(iCalUID,id,summary,location,description,extendedProperties/private,status,start,end)'
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
      return jsonResponse({ ok: true, id: assignedEvent.getId(), message: 'Personnel assigned to calendar event.' });
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

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
