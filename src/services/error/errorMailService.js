import { apiService } from '../api/apiService.js';
import {
  getDocId,
  getSharedKey,
  getUserInfo,
  getWindowRef,
  isJournal,
  isLocalHost,
  isUatDomain
} from './errorContext.js';
import { MAIL_TEMPLATE_ID, getSenderReceiverIds } from './errorMailConfig.js';
import { buildMailTableHtml } from './errorMailHtml.js';
import { fetchErrorLogs, insertErrorLog, shouldSendAfterLookup } from './errorLogsApi.js';
import { recordSubject, shouldSkipSubject } from './errorSubjectMap.js';

let cachedSender = null;

export function resetErrorMailState() {
  cachedSender = null;
}

function getSender() {
  if (!cachedSender?.from) cachedSender = getSenderReceiverIds();
  return cachedSender;
}

function stripTracePrefix(track) {
  return String(track || '').split('Impact Trace:').join('');
}

function resolveUserMail(isValidate) {
  const shared = getSharedKey();
  const user = getUserInfo();
  if (isValidate) {
    const emailto = shared.emailto;
    return Array.isArray(emailto) && emailto.length === 1 ? emailto[0] : emailto;
  }
  return user.MAIL_ID;
}

function mailDomain() {
  const loc = getWindowRef()?.location;
  if (!loc) return '';
  let path = loc.pathname || '';
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep raw pathname
  }
  return `${loc.hostname || ''}${path}`;
}

function envInfoHtml() {
  if (!isUatDomain()) return '';
  const info = getWindowRef()?.ONE_LINE_ENV_INFO;
  return `<tr class="align-top"><td>Browser Details:</td><td class="ml-2">${info ? info : 'Nil'}</td></tr>`;
}

function buildNormalMessage(subject, track, message, stackHtml) {
  const isValidate = subject === 'Validate_URL';
  const shared = getSharedKey();
  const user = getUserInfo();
  const projectName = shared.projectname ? shared.projectname : null;
  const clientType = isValidate || isJournal() ? 'Journal' : 'Book';
  let userRowsHtml =
    `<tr><td class="align-top">DOC ID:</td><td class="">${getDocId()}</td></tr>` +
    `<tr><td class="align-top">User Id:</td><td class="">${resolveUserMail(isValidate)}</td></tr>` +
    `<tr><td class="align-top" style="width: 15%;">Project Name:</td><td class="">${projectName}</td></tr>` +
    `<tr><td class="align-top" style="width: 15%;">Client Type:</td><td class="">${clientType}</td></tr>`;
  if (!isValidate) {
    userRowsHtml += `<tr><td class="align-top">User Role:</td><td class="">${user.ROLE_NAME || ''}</td></tr>`;
  }

  let errRowsHtml = '';
  if (track) {
    errRowsHtml += `<tr><td class="align-top">Impact Trace Order</td><td class="" style="color: #1000ff";>${stripTracePrefix(track)}</td></tr>`;
  }
  if (message) {
    errRowsHtml += `<tr><td class="align-top">Error Message</td><td class="" style="color: red";>${message}</td></tr>`;
  }
  if (stackHtml) {
    errRowsHtml += `<tr><td class="align-top">Stack Order</td><td class="" style="color: blueviolet;font-size:10pt;" >${stackHtml}</td></tr>`;
  }

  return buildMailTableHtml({
    userRowsHtml,
    errRowsHtml,
    version: getWindowRef()?.VERSION || '',
    domain: mailDomain(),
    envInfoHtml: envInfoHtml()
  });
}

export function buildMetaErrorHtml(track, stackHtml, errMessage) {
  const url = decodeURIComponent(String(getWindowRef()?.location || ''));
  const userRowsHtml =
    `<tr><td class="align-top">URL:</td><td class="">${url}</td></tr>` +
    `<tr><td class="align-top">Impact Trace Order</td><td class="" style="color: #1000ff";>${track ? stripTracePrefix(track) : ''}</td></tr>` +
    `<tr><td class="align-top">Error Message</td><td class="" style="color: red";>${errMessage || ''}</td></tr>` +
    `<tr><td class="align-top">Stack Order</td><td class="" style="color: blueviolet;font-size:10pt;" >${stackHtml || ''}</td></tr>`;
  return buildMailTableHtml({
    userRowsHtml,
    errRowsHtml: '',
    version: getWindowRef()?.VERSION || '',
    domain: mailDomain(),
    envInfoHtml: envInfoHtml()
  });
}

export function buildNormalMailPayload(subject, track, message, stackHtml) {
  const ids = getSender();
  return {
    tbl: 'emaildraft',
    emailfrom: ids.from,
    emailto: ids.to,
    emailBCC: ids.bcc,
    emailSubject: subject,
    find: { id: MAIL_TEMPLATE_ID },
    docid: getDocId(),
    emailMessage: buildNormalMessage(subject, track, message, stackHtml)
  };
}

export function buildMetaMailPayload(module, track, message, stackHtml) {
  const ids = getSender();
  return {
    tbl: 'emaildraft',
    emailfrom: ids.from,
    emailto: ids.to,
    emailSubject: `Error_Mail_ERROR_${module || 'Nil'}`,
    find: { id: MAIL_TEMPLATE_ID },
    docid: getDocId(),
    emailMessage: buildMetaErrorHtml(track, stackHtml, message)
  };
}

export async function sendMailIfAllowed(info) {
  const win = getWindowRef() || {};
  const canLocal = Boolean(win.CanSendLocalMail);
  if ((canLocal && isLocalHost()) || !isLocalHost()) {
    return apiService.sendEmail(info);
  }
}

/**
 * Normal error-mail path (legacy ErrorShareMail).
 * Existence GET_DOCS runs before insert so the 10-minute gate sees prior rows, not the row just written.
 */
export async function shareErrorMail(subject, track, message, stackHtml) {
  try {
    const win = getWindowRef() || {};
    if (!win.CanSendLocalMail && isLocalHost()) {
      return false;
    }
    if (shouldSkipSubject(subject)) {
      console.warn('Repeated error on the ' + subject);
      return false;
    }
    recordSubject(subject);
    const mailInfo = buildNormalMailPayload(subject, track, message, stackHtml);
    const response = await fetchErrorLogs({ module: subject, errormsg: message });
    const insertP = insertErrorLog({ module: subject, errormsg: message, fnTrack: track });
    if (shouldSendAfterLookup(response)) {
      await sendMailIfAllowed(mailInfo);
    }
    await insertP;
  } catch (err) {
    console.warn(err?.message || err);
  }
}
