// File: utils/replacePlaceholders.js
const fs = require('fs');
const path = require('path');

// Template map configuration for component snippets
const templateMap = {
    "browser": "snippet/component/browser.html",
    "doi_info": "snippet/component/doi_info.html",
    "form_button_group": "snippet/component/form_button_group.html",
    "disc_trans": "snippet/component/disc_trans_accept.html",
    "trans_only": "snippet/component/trans_accept.html",
    "reCaptcha_google": "snippet/component/reCaptcha_google.html",
    "analytics_clarity": "snippet/component/analytics_clarity.html",
    "browser_checker": "snippet/component/browser_checker.html",
    // Per-client landing page instructions
    "instructions_default":    "snippet/component/instructions/default.html",
    "instructions_nihr":       "snippet/component/instructions/nihr.html",
    "instructions_oup":        "snippet/component/instructions/oup.html",
    "instructions_oso":        "snippet/component/instructions/oso.html",
    "instructions_oho":        "snippet/component/instructions/oho.html",
    "instructions_acs":        "snippet/component/instructions/acs.html",
    "instructions_lww":        "snippet/component/instructions/lww.html",
    "instructions_brill":      "snippet/component/instructions/brill.html",
    "instructions_plos":       "snippet/component/instructions/plos.html",
    "instructions_intellect":  "snippet/component/instructions/intellect.html",
    "instructions_medknow":    "snippet/component/instructions/medknow.html",
    "instructions_tnf":        "snippet/component/instructions/tnf.html",
    "instructions_tnfjournals":"snippet/component/instructions/tnfjournals.html",
};

/**
 * Read the content of a template file
 * @param {string} filePath - Relative path to the template file
 * @returns {string} File contents or empty string if error
 */
function readTemplateFile(filePath) {
    try {
        return fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return '';
    }
}

/**
 * Replace placeholders in content with environment config or template content
 * @param {string} content - Original content with placeholders
 * @param {Object} [customEnvConfig] - Optional custom environment configuration
 * @returns {string} Content with placeholders replaced
 */
function replacePlaceholders(content, customEnvConfig) {
    // Use custom config if provided, otherwise load from environment
    const envConfig = customEnvConfig || global.config;


    return content.replace(/\$\{\{(.*?)\}\}\$/g, (match, key) => {
        const trimmedKey = key.trim();

        // Resolve ${{client_instructions}}$ by reading CLIENT.INSTRUCTIONS_TPL from env config
        if (trimmedKey === 'client_instructions') {
            const tpl = (envConfig.CLIENT && envConfig.CLIENT.INSTRUCTIONS_TPL) || 'default';
            const instructionKey = `instructions_${tpl}`;
            if (templateMap.hasOwnProperty(instructionKey)) {
                let templateContent = readTemplateFile(templateMap[instructionKey]);
                return replacePlaceholders(templateContent, envConfig);
            }
            return '';
        }

        // Check for direct environment configuration match
        if (envConfig.hasOwnProperty(trimmedKey)) {
            return envConfig[trimmedKey];
        }

        // Check for template map match
        if (templateMap.hasOwnProperty(trimmedKey)) {
            // Read the template file
            let templateContent = readTemplateFile(templateMap[trimmedKey]);

            // Recursively replace placeholders in the template
            templateContent = replacePlaceholders(templateContent, envConfig);

            return templateContent;
        }

        // Handle nested properties in environment config
        const nestedProps = trimmedKey.split('.');
        let value = envConfig;
        for (let prop of nestedProps) {
            value = value && value[prop];
        }

        // Return the found value or original placeholder if not found
        return value !== undefined ? value : match;
    });
}

module.exports = replacePlaceholders;