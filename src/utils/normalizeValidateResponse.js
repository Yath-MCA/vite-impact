export function normalizeValidateResponse(response) {
  const resData = response?.data ?? response ?? {};
  const docid = resData.docid || resData.identifier || resData.docId || '';
  const articletitle = resData.xmltohtmlres?.articletitle || '';
  const journaltitle = resData.xmltohtmlres?.journaltitle || '';
  const booktitle = resData.xmltohtmlres?.booktitle || '';
  const projecttitle = resData.projecttitle || '';
  const title =
    articletitle ||
    booktitle ||
    projecttitle ||
    journaltitle ||
    resData.title ||
    '';

  return {
    docid,
    title,
    doi: resData.doi || resData.DOI || resData.xmltohtmlres?.doi || '',
    client: resData.client || 'default',
    projecttitle,
    identifier: resData.identifier || docid,
    dtd: resData.dtd || '',
    type: resData.type || '',
    linkinfo: resData.linkinfo || '',
    vendor: resData.vendor || '',
    shorttitle: resData.shorttitle || '',
    username: resData.username || resData.mail_id || resData.MAIL_ID || '',
    role: resData.role || resData.roleid || resData.ROLE_ID || '',
    rolename: resData.rolename || resData.ROLENAME || '',
    roleid: resData.roleid || resData.ROLE_ID || '',
    branding: resData.branding || resData.client_metadata || resData.client_config || null,
    cover: resData.titleinfo?.cover,
    projectname: resData.titleinfo?.projectname,
    journaltitle,
    articletitle,
    booktitle,
    authorgroup: resData.xmltohtmlres?.authorgroup || '',
    figcount: resData.xmltohtmlres?.figcount || 0,
    tablecount: resData.xmltohtmlres?.tablecount || 0,
    Query: resData.xmltohtmlres?.Query || 0,
    Equation: resData.xmltohtmlres?.Equation || 0,
    collaborative: resData.collaborative,
    apikey: resData.apikey || '',
    emailto: resData.emailto,
    raw: resData
  };
}

export function assertValidateAccess(response) {
  const resData = response?.data ?? response ?? {};
  const r = response?.r ?? resData.r;

  if (r === 0) throw new Error('Access denied. Please contact support.');
  if (r === 4) throw new Error('Your IP address does not have permission to access this link.');
  if (resData.status === 'expired' || resData.fdel) throw new Error('This proof link has expired.');
  if (resData.status === 'deactive') throw new Error('This proof link has been deactivated.');
}
