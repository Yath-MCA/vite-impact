import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, HelpCircle, BookOpen, Monitor } from 'lucide-react';

// Get BUCKET_URL from window.ENV or fallback
const BUCKET_URL = window.ENV?.BUCKET_URL || window.BUCKET_URL || 'http://localhost/xmleditor/';

// Get cover image URL
const getCoverImageUrl = (coverName, clientName) => {
  if (!coverName || !clientName) return null;
  return `${BUCKET_URL}_SUPPORT_FILES/${clientName.toUpperCase()}/cover/${coverName}.png`;
};

// Browser compatibility information (from src/snippets/component/browser.html)
const BROWSER_COMPATIBILITY = {
  windows: {
    os: 'Windows OS',
    version: '8.1 and above',
    browsers: ['Chrome 72+', 'Firefox 66+', 'Edge 80+']
  },
  mac: {
    os: 'MAC OS',
    version: '10.15 and above',
    browsers: ['Chrome 72+', 'Firefox 66+', 'Safari 14.1+']
  },
  linux: {
    os: 'Linux',
    version: 'Ubuntu 18.04 and above',
    browsers: ['Chrome 72+', 'Firefox 66+']
  }
};

// Client-specific instruction templates (mirroring src/snippets/component/instructions/)
const INSTRUCTIONS = {
  medknow: {
    title: 'Instructions',
    items: [
      'Log in to IMPACT in a single browser window at a time (but if you would like your co-authors to review the article as well, please share it with them by selecting the sharing option in IMPACT).',
      'Review your proof carefully, making any necessary amendments directly into the article.',
      'Save your changes if you want to pause reviewing and use the logout option before closing the browser window. You may log in again later to resume reviewing using your log-in link.',
      'Only finish your review in IMPACT when you are sure you have no additional changes to add as the review will be closed and not be accessible after reviewing has been completed.',
      'Note that the images in IMPACT are low resolution to optimize the performance of the tool.',
      'Submit the article when you have reviewed the entire article and resolved all author queries.',
      'You will receive a copy of the proof with your changes tracked via email for your own records.'
    ],
    disclaimer: 'These proofs are for checking purposes only. They should not be considered as final publication format and must not be used for any other purpose. Please do not post them on your personal/institutional website, and do not print and distribute copies. Neither excerpts nor the whole article in its entirety should be included in other publications until the final version has been published and citation details are available.',
    thirdPartyPlugins: {
      title: 'Third Party Plug-Ins:',
      text: 'Using any third-party plug-in to translate the content or make any changes in the editor is not recommended as it might affect the content quality and the underlying metadata, which will delay publication.',
      chineseLabel: 'Chinese Version:',
      chineseText: '请不要使用任何第三方插件翻译或者修改编辑器中的内容，因为这样可能会影响内容质量和底层元数据，从而导致发表延迟。'
    }
  },
  plos: {
    title: 'Instructions',
    items: [
      'Log in to IMPACT in a single browser window at a time (but if you would like your co-authors to review the article as well, please share it with them by selecting the sharing option in IMPACT).',
      'Review your proof carefully, making any necessary amendments directly into the article.',
      'Save your changes if you want to pause reviewing and use the logout option before closing the browser window. You may log in again later to resume reviewing using your log-in link.',
      'Only finish your review in IMPACT when you are sure you have no additional changes to add as the review will be closed and not be accessible after reviewing has been completed.',
      'Note that the images in IMPACT are low resolution to optimize the performance of the tool.',
      'Submit the article when you have reviewed the entire article and resolved all author queries.',
      'You will receive a copy of the proof with your changes tracked via email for your own records.'
    ],
    disclaimer: 'These proofs are for checking purposes only. They should not be considered as final publication format and must not be used for any other purpose. Please do not post them on your personal/institutional website, and do not print and distribute copies. Neither excerpts nor the whole article in its entirety should be included in other publications until the final version has been published and citation details are available.',
    thirdPartyPlugins: {
      title: 'Third Party Plug-Ins:',
      text: 'Using any third-party plug-in to translate the content or make any changes in the editor is not recommended as it might affect the content quality and the underlying metadata, which will delay publication.',
      chineseLabel: 'Chinese Version:',
      chineseText: '请不要使用任何第三方插件翻译或者修改编辑器中的内容，因为这样可能会影响内容质量和底层元数据，从而导致发表延迟。'
    },
    requiresCaptcha: true
  },
  default: {
    title: 'Instructions',
    items: [
      'Take a thorough look at your proof and make any necessary modifications directly within the reports or article.',
      'It should be noted that the images in IMPACT have a low resolution to enhance the performance of the tool.',
      'Once you have reviewed the entire report and resolved all author queries, submit the article.',
      'An email will be sent to you with a copy of the proof containing your tracked changes for your own records.'
    ],
    disclaimer: 'The proofs provided are intended solely for checking purposes and should not be regarded as the final publication format, nor should they be utilized for any other reason. It is crucial that they are not posted on personal or institutional websites or printed and distributed. Until the final version has been published and citation details are obtainable, no excerpts or the entire article in its entirety should be included in any other publications.',
    thirdPartyPlugins: {
      title: 'Third Party Plug-Ins:',
      text: 'Using any third-party plug-in to translate the content or make any changes in the editor is not recommended as it might affect the content quality and the underlying metadata, which will delay publication.',
      chineseLabel: 'Chinese Version:',
      chineseText: '请不要使用任何第三方插件翻译或者修改编辑器中的内容，因为这样可能会影响内容质量和底层元数据，从而导致发表延迟。'
    }
  }
};

export default function ValidateUrlLanding({ docData }) {
  const navigate = useNavigate();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);

  const clientName = (docData?.clientname || 'default').toLowerCase();
  const instructions = INSTRUCTIONS[clientName] || INSTRUCTIONS.default;
  const isPlos = clientName === 'plos';
  const coverImageUrl = getCoverImageUrl(docData?.cover, clientName);

  // Extract branding from response (takes precedence over env file)
  const branding = docData?.branding || {};
  const logoSrc = branding.LOGO_SRC || branding.logo_src || branding.logoSrc;
  const logoAlt = branding.LOGO_ALT || branding.logo_alt || branding.logoAlt || 'IMPACT';
  const logoHeight = branding.LOGO_HEIGHT || branding.logo_height || branding.logoHeight || '32';
  const logoWidth = branding.LOGO_WIDTH || branding.logo_width || branding.logoWidth || '';
  const welcomeHtml = branding.WELCOME_TEXT || branding.welcome_text || branding.welcomeText;
  const pageTitle = branding.PAGE_TITLE || branding.page_title || branding.pageTitle;

  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  const handleContinue = () => {
    if (isPlos && !captchaVerified) {
      alert('Please complete the reCAPTCHA verification first.');
      return;
    }
    navigate('/editor');
  };

  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={logoAlt}
                  height={logoHeight}
                  width={logoWidth}
                  className="object-contain"
                  style={{ maxHeight: `${logoHeight}px` }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="text-2xl font-black text-primary-600">IMPACT</div>
              )}
              {docData?.client && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {docData.client}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                FAQs
              </a>
              <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                User Guide
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-6 mb-6 shadow-lg">
          {welcomeHtml ? (
            <div
              className="prose prose-invert max-w-none branding-welcome"
              dangerouslySetInnerHTML={{ __html: welcomeHtml }}
            />
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">
                Welcome to <span className="font-black">IMPACT</span>
              </h1>
              <p className="text-primary-100">
                The online proofing tool for collaborating on journal content
                {docData?.projecttitle && ` — ${docData.projecttitle}`}
              </p>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Left: Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              {instructions.title}
            </h2>

            <ul className="space-y-2.5 mb-6">
              {instructions.items.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2.5 leading-relaxed">
                  <span className="text-primary-600 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                If you need assistance with IMPACT, please review the{' '}
                <a href="#" className="text-primary-600 hover:underline font-semibold">FAQs</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:underline font-semibold">User Guide</a>
                {' '}or contact our support team at{' '}
                <a href="mailto:impact.helpdesk@newgen.co" className="text-primary-600 hover:underline font-semibold">
                  impact.helpdesk@newgen.co
                </a>
              </p>
            </div>

            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">
                Disclaimer
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-4">
                {instructions.disclaimer}
              </p>

              {/* Third Party Plugins - Medknow Chinese translation */}
              {instructions.thirdPartyPlugins && (
                <div className="pt-3 border-t border-amber-200 dark:border-amber-700">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">
                    {instructions.thirdPartyPlugins.title}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
                    {instructions.thirdPartyPlugins.text}
                  </p>
                  <div className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">
                    {instructions.thirdPartyPlugins.chineseLabel}
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed" lang="zh-CN">
                    {instructions.thirdPartyPlugins.chineseText}
                  </p>
                </div>
              )}
            </div>

            {/* reCAPTCHA for PLOS */}
            {isPlos && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {captchaVerified ? '✓ Verification Complete' : 'Security Verification Required'}
                  </span>
                  {!captchaVerified && (
                    <button
                      onClick={handleCaptchaVerify}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Verify (Demo)
                    </button>
                  )}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Google reCAPTCHA would load here in production
                </p>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              AGREE & CONTINUE
            </button>
          </div>

          {/* Right: Document Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex gap-6 mb-6">

              {/* Cover Image */}
              <div className="flex-shrink-0 w-36">
                <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex flex-col items-center justify-center shadow-md overflow-hidden">
                  {coverImageUrl && !coverImageError ? (
                    <img
                      src={coverImageUrl}
                      alt={`Cover: ${docData?.cover}`}
                      className="w-full h-full object-cover"
                      onError={() => setCoverImageError(true)}
                    />
                  ) : (
                    <>
                      <BookOpen className="w-16 h-16 text-white mb-3 opacity-80" />
                      {docData?.cover && (
                        <div className="text-white text-center px-2">
                          <div className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-1">
                            Cover
                          </div>
                          <div className="text-lg font-bold break-all">
                            {docData.cover}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Journal/Book Title */}
                {(docData?.journaltitle || docData?.booktitle) && (
                  <div>
                    <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                      {docData?.dtd === 'jats' ? 'Journal' : 'Book'} Title
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {docData.journaltitle || docData.booktitle}
                    </h3>
                  </div>
                )}

                {/* DOI */}
                {docData?.doi && (
                  <div className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">
                    {docData.doi}
                  </div>
                )}

                {/* Article Title */}
                {docData?.articletitle && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Article Title
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white leading-snug">
                      {docData.articletitle}
                    </p>
                  </div>
                )}

                {/* Authors */}
                {docData?.authorgroup && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      Authors
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {docData.authorgroup}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            {(docData?.figcount !== undefined || docData?.tablecount !== undefined || docData?.Query !== undefined) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-3">
                  {docData?.figcount !== undefined && (
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600">
                        {docData.figcount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Figures
                      </div>
                    </div>
                  )}
                  {docData?.tablecount !== undefined && (
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600">
                        {docData.tablecount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Tables
                      </div>
                    </div>
                  )}
                  {docData?.Query !== undefined && (
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600">
                        {docData.Query}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Queries
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer - Browser Compatibility */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-white py-8 mt-8 border-t border-gray-700">
        <div className="container mx-auto px-4">

          {/* Supported Browsers Title */}
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-700">
            <Monitor className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Supported Browsers</h3>
          </div>

          {/* Browser Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Windows */}
            <div>
              <h4 className="font-bold text-primary-300 mb-2">
                {BROWSER_COMPATIBILITY.windows.os} <span className="text-sm font-normal text-gray-400">({BROWSER_COMPATIBILITY.windows.version})</span>
              </h4>
              <ul className="space-y-1.5">
                {BROWSER_COMPATIBILITY.windows.browsers.map((browser, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    {browser}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mac */}
            <div>
              <h4 className="font-bold text-primary-300 mb-2">
                {BROWSER_COMPATIBILITY.mac.os} <span className="text-sm font-normal text-gray-400">({BROWSER_COMPATIBILITY.mac.version})</span>
              </h4>
              <ul className="space-y-1.5">
                {BROWSER_COMPATIBILITY.mac.browsers.map((browser, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    {browser}
                  </li>
                ))}
              </ul>
            </div>

            {/* Linux */}
            <div>
              <h4 className="font-bold text-primary-300 mb-2">
                {BROWSER_COMPATIBILITY.linux.os} <span className="text-sm font-normal text-gray-400">({BROWSER_COMPATIBILITY.linux.version})</span>
              </h4>
              <ul className="space-y-1.5">
                {BROWSER_COMPATIBILITY.linux.browsers.map((browser, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    {browser}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
            © {new Date().getFullYear()} IMPACT Online Proofing | Powered by Newgen KnowledgeWorks
          </div>
        </div>
      </footer>

    </div>
  );
}

