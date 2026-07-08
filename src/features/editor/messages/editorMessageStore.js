import { EditorMessageKey } from './editorMessageKeys.js';

/** Ported from run-task/current/_initialAlertmessageLoader.js — do not mutate at runtime. */
export const EDITOR_MESSAGES = Object.freeze({
        [EditorMessageKey.REF_DELETE_001]: Object.freeze({ 
            'prompt': {
                'title': 'Reference',
                'text': 'Do you want to delete the reference from the list?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The citation and reference text has been deleted from the list successfully.',
                're_num': 'The citation and reference text has been deleted from the list and renumbered successfully.',
                'cite_miss': 'The citation and reference text has been deleted from the list successfully. <br><br>Renumbering is not excuted due to a missing citations [{{miss_cite}}] in the article. Kindly include the missing citations to initiate an automatic renumbering of the references. To insert the missing citations, follow these steps:<br>(1) Position the cursor where you want to insert the citation.<br>(2) Right-click and choose "Insert Citation" from the context menu.<br>(3) Select the appropriate citation from the  list.<br>(4) Click "Insert" to link the citation.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Reference is safe :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.XREF_DELETE_002]: Object.freeze({ 
            'prompt': {
                'title': 'Reference',
                'text': 'Do you want to delete the citation and the reference %1% from the list?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The citation and reference text has been deleted from the list successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Reference is safe :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.XREF_DELETE_003]: Object.freeze({ 
            'prompt': {
                'title': 'Reference',
                'text': 'Do you want to delete the citation and the reference [%1%] from the list?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The citation and reference text has been deleted from the list successfully.',
                're_num': 'The citation and reference text has been deleted from the list and renumbered successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Reference is safe :)',
                'icon': 'error'
            }
            
        }),
        [EditorMessageKey.XREF_DELETE_004]: Object.freeze({ 
            'prompt': {
                'title': 'Figure',
                'text': 'Would you like to delete the citation and the %1% from the list?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The citation has been deleted from the text and the caption list successfully.',
                're_num': 'The citation has been deleted from the text and the caption list and has been renumbered successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Caption is safe :)',
                'icon': 'error'
            }
            
        }),
        [EditorMessageKey.AUTHOR_DELETE_001]: Object.freeze({ 
            'prompt': {
                'title': 'Author Group',
                'text': 'Would you like to delete the author from the Author group?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The {{author}} has been deleted successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Author name is safe :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AUTHOR_DELETE_002]: Object.freeze({ 
            'prompt': {
                'title': 'Author Group',
                'text': 'Would you like to delete the author from the Author group?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The author has been deleted with the cross-link successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Author name is safe :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.LINK_RENUMBER_001]: Object.freeze({ 
            'prompt': {
                'title': 'Author Group',
                'text': '',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'Successfully renumbered.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Original order available :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AFF_DELETE_001]: Object.freeze({ 
            'prompt': {
                'title': 'Author Group',
                'text': 'Do you want to remove the affiliation &ldquo;{{label}}&rdquo;?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'Affiliation has been deleted successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': ':)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AFF_DELETE_002]: Object.freeze({
            'prompt': {
                'title': 'Author Group',
                'text': 'Would you like to delete the affiliation link associated with the author{{pural}} &ldquo;{{name}}&rdquo;?',

                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The affiliation link associated with the author{{pural}} {{name}} has been deleted successfully',

                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Renumbering not done. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AFF_DELETE_004]: Object.freeze({
            'prompt': {
                'title': 'Author Group',
                'text': 'The affiliation &ldquo;{{label}}&rdquo; had linked to the author {{name}}. Would you like to delete it along with the cross-link?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'Affiliation and the cross-link have been deleted successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Renumbering not done. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AFF_DELETE_003]: Object.freeze({
            'prompt': {
                'title': 'Author Group',
                'text': 'Do you want to remove the cross-links?',
                'text_1': 'The citation not mapped for some authors. Do you want to continue?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'Affiliation cross-links have been deleted successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'Renumbering not done. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AG_AFF_GROUP]: Object.freeze({
            "ADD_AFF_AUT": "Please add affiliation to the {{{plural}}} {{{item}}}",
            
            "ADD_AFF_LINK": `Please link the affiliation  &ldquo;{{item}}&rdquo; to the author group.`,            
            "DEL_AUTH": "Would you like to delete {{name}} from the Author group?",
            "DEL_AUTH_W_LAB": "Affiliation &ldquo;{{label}}&rdquo; is linked only to deleted author {{name}}. Hence affiliation &ldquo;{{label}}&rdquo; will also be deleted.",
            "DEL_AUTH_W_AFF": "Would you like to delete the {{name}} along with the affiliation {{label}}?",
            "UN_LINK_AFF": `Affiliation &ldquo;{{label}}&rdquo; is not linked with anyone the author. Would you like to delete the Affiliation? If yes, the details will be removed from the list.`,
            "UNKNOWN_LAB": "Kindly provide the label from the affiliation list to the author group."
        }),
        [EditorMessageKey.TC_NEW_MSG]: Object.freeze({
            
            "add": {
                "auth": "The placeholder was added for the new author {{{timestamp}}}.",
                "aff": "Affiliation &ldquo;{{label}}&rdquo; has been added {{{timestamp}}}.",
                "kwd": "The placeholder was added for the new keyword {{{timestamp}}}.",
                "abbr": "The placeholder was added for the new abbreviation {{{timestamp}}}.",
                "auth_text": "The author {{name}} was added {{{timestamp}}}.",
                "kwd_text": "The &ldquo;{{name}}&rdquo; keyword was added {{{timestamp}}}.",
                "abbr_text": "The &ldquo;{{name}}&rdquo; abbreviation was added {{{timestamp}}}.",
                "auth_note": "Author note &ldquo;{{label}}&rdquo; has been added {{{timestamp}}}.",
                "auth_note_text": "Author note &ldquo;{{label}}&rdquo; has been added {{{timestamp}}}.",
                "auth_note_old": "The placeholder was added for the author note {{{timestamp}}}."
            },
            "OpenDialog": {
                "auth_dialog_update": "The author {{name}} details has been updated {{{timestamp}}}. {{{sub_action}}}",
            },
            "delete": {
                "auth": {
                    
                    "pl_hold": "The placeholder created for the author name was deleted {{{timestamp}}}.",
                    "w_link": "The author {{name}} has been deleted along with the link {{{timestamp}}}.",
                    "wo_link": 'The author {{name}} was deleted {{{timestamp}}}.'
                },
                "aff": {
                    
                    "pl_hold": 'Affiliation &ldquo;{{label}}&rdquo; has been deleted {{{timestamp}}}.', 
                    "w_link": "Affiliation &ldquo;{{label}}&rdquo; has been deleted along with the cross-link {{{timestamp}}}.",
                    "wo_link": 'Affiliation &ldquo;{{label}}&rdquo; has been deleted {{{timestamp}}}.'
                },
                "kwd": {
                    "text": "The &ldquo;{{name}}&rdquo; keyword was deleted {{{timestamp}}}.",
                    "pl_hold": "The placeholder created for the keyword was deleted {{{timestamp}}}.",

                },
                "abbr": {
                    "text": "The &ldquo;{{name}}&rdquo; abbreviation was deleted {{{timestamp}}}.",
                    "pl_hold": "The placeholder created for the abbreviation was deleted {{{timestamp}}}.",

                },
                "auth_note": {
                    "pl_hold": "The placeholder created for the new author note was deleted {{{timestamp}}}.",
                    "wo_link": "Author note &ldquo;{{label}}&rdquo; has been deleted {{{timestamp}}}.",
                    "w_link": "Author note &ldquo;{{label}}&rdquo; has been deleted along with the cross-link {{{timestamp}}}.",
                }
            },
            "move": { 
                "auth": {
                    
                    "pl_hold": "The placeholder created for the author name has been moved to the {{action}} {{{timestamp}}}.",
                    "text": "The author {{name}} has been moved to the {{action}} {{{timestamp}}}."
                },
                "aff": {},
                "kwd": {
                    "text": "The &ldquo;{{name}}&rdquo; keyword moved {{action}} {{{timestamp}}}.",
                    "pl_hold": "The placeholder created for the keyword moved {{action}} {{{timestamp}}}."
                },
                "abbr": {
                    "text": "The &ldquo;{{name}}&rdquo; abbreviation moved {{action}} {{{timestamp}}}.",
                    "pl_hold": "The placeholder created for the abbreviation moved {{action}} {{{timestamp}}}."
                }
            },
            "swap": {
                "auth": {
                    
                    "pl_hold": "The Given name and Surname for the author placeholder swapped {{{timestamp}}}.",
                    "text": "The Given name and Surname for the author &ldquo;{{name}}&rdquo; swapped {{{timestamp}}}."
                }
            },
            "link": {
                
                "aff": {
                    "add": "Affiliation &ldquo;{{label}}&rdquo; have linked to the author &ldquo;{{name}}&rdquo; {{{timestamp}}}."
                }
            },
            "delete_link": {
                "aff": {
                    "remove": "Affiliation &ldquo;{{label}}&rdquo; have un-linked to the author &ldquo;{{name}}&rdquo; {{{timestamp}}}.",
                    "w_link": "Affiliation &ldquo;{{label}}&rdquo; has been deleted along with the cross-link {{{timestamp}}}."
                }
            },
            "orcid": {
                "orcid_added": "The author {{name}} ORCID was added {{{timestamp}}}.",
                "orcid_edited": "The author {{name}} ORCID was edited {{{timestamp}}}.",
            }
        }),
        [EditorMessageKey.HEAD_LEVEL_ADD_001]: Object.freeze({ 
            'prompt': {
                'title': 'Heads Section',
                'text': 'Do you want to add a new section here?',
                'icon': 'warning',
                'okText': 'Yes, Add it!',
                'canText': 'No'
            },
            'success': {
                'title': 'ADDED!',
                'text': 'The Section added successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'The Section not added. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.HEAD_LEVEL_DEL_002]: Object.freeze({ 
            'prompt': {
                'title': 'Heads Section',
                'text': 'Do you want to delete the section?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Deleted!',
                'text': 'The section deleted successfully.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'The section not deleted. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.AUTO_SAVE]: Object.freeze({
            'text': 'Content save is automatic and enabled every 30 seconds.',

        }),
        [EditorMessageKey.OFFLINE]: Object.freeze({
            'text': 'Please continue editing offline and updated content gets synchronized to the server once you are back online.',
            'collaborative': `Your network connection has been interrupted. Editing has been temporarily paused to prevent any data loss. Please check your connection and reconnect to continue working on the document.`,
        }),
        [EditorMessageKey.ON_LINE]: Object.freeze({
            'text': 'You\'re online.',
            'withSave': "You are back online now. The updated contents have been saved successfully to the server."
        }),
        [EditorMessageKey.OFFLINE_SAVE]: Object.freeze({
            'text': 'Note! Please login to the same browser/machine to restore the changes made to the document if you closed the proof directly while offline.'
        }),
        [EditorMessageKey.SAVE_OFFLINE_DATA_ASK]: Object.freeze({
            "type": "warning",
            "title": "Offline Data",
            'text': 'Your proof opened with unsaved content. Please click &ldquo;yes&rdquo; to save the changes made to the document.',
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),

        [EditorMessageKey.SAVE_OFFLINE_DATA_YES]: Object.freeze({
            'text': 'The document has been saved successfully with updated content.'
        }),
        [EditorMessageKey.FILE_NOT_SAVE]: Object.freeze({
            'text': `A technical issue is currently preventing proofing, possibly due to a translator plugin.<br><br>We&rsquo;ve notified our technical team and copied you on the email. Our support team will update you once the issue is resolved, which is typically within 1 working day.`
        }),
        [EditorMessageKey.SIGN_OUT_OFF_LINE]: Object.freeze({
            'text': 'Sorry, this function is disabled while offline. Kindly try back when you are online.'
        }),
        [EditorMessageKey.MATH_OFF_LINE_ERROR]: Object.freeze({
            'text': 'Sorry, this function is disabled while offline. Kindly try back when you are online.'
        }),
        [EditorMessageKey.I_WSC_OFF_LINE_ERROR]: Object.freeze({
            'text': 'Sorry, this function is disabled while offline. Kindly try back when you are online.'
        }),
        [EditorMessageKey.OFF_LINE_ERROR_SHOW]: Object.freeze({ // Mantis Id 1996925: Finalize message offline
            'text': 'Apologies, but we are currently unable to establish an internet connection. This function is disabled in offline mode. Please try again when you regain an internet connection taking care to use the same browser.'
        }),
        [EditorMessageKey.PACKAGE]: Object.freeze({
            'text': 'Files downloaded successfully.'
        }),
        [EditorMessageKey.GENERATE_PDF]: Object.freeze({
            'text': 'Please do not refresh the page. This process may take around 30 secs to 3 mins approximately.',
        }),
        [EditorMessageKey.DEMO_GENERATE_PDF]: Object.freeze({
            'text': '',
            'hilti': 'We have received your proof generation request. Your proof will be ready in approximately 60 minutes.'
        }),
        [EditorMessageKey.GENERATE_XML_ERROR]: Object.freeze({
            'text': 'Oops! Error while generating XML. Kindly contact the support team for assistance.'
        }),
        // ? 3386868: OSO - IMPACT Creation - Urgent - alert message from Srini - Teams
        [EditorMessageKey.GENERATE_PDF_ERROR]: Object.freeze({
            'text': `Oops! An error occurred while generating the Track PDF. Please use the 'Contact Support' option under the Help menu at the top right for assistance.`
        }),
        // ? 3386868: OSO - IMPACT Creation - Urgent - alert message from Srini - Teams
        [EditorMessageKey.TRACK_PDF_PRE_WARN]: Object.freeze({
            'text': `Please do not refresh or close the page.<br><br>The download process may take approximately 30 seconds to a few minutes, depending on your internet speed and the amount of data being processed.`,
        }),
        [EditorMessageKey.GENERATE_PDF_LAST_ERROR]: Object.freeze({
            'text': 'Caution! Failure due to some technical error. Kindly contact the support team for assistance.'
        }),
        [EditorMessageKey.UPDATE_FILE_MISS]: Object.freeze({
            'text': 'The updated file does not exist in the corresponding path.'
        }),
        [EditorMessageKey.FILE_MISSING]: Object.freeze({
            'text': 'Sorry! The file is missing in the corresponding path.'
        }),
        [EditorMessageKey.DOWNLOAD_SUCCESS_PROOF_PDF]: Object.freeze({
            'text': 'Please note that this PDF is only for review purposes, you should not add annotations, comments, or corrections to the PDF; instead any changes or edits should be made directly within the text editor.',
        }),

        [EditorMessageKey.FILE_DOWNLOAD_SUCCESS]: Object.freeze({
            'text': 'The file is downloaded successfully.'
        }),
        [EditorMessageKey.FILE_DOWNLOAD_FAIL]: Object.freeze({
            'text': 'The required file is missing in the corresponding path. Kindly contact the support team for assistance.'
        }),
        [EditorMessageKey.SHARE_INVITE_USER]: Object.freeze({
            'text': 'The link was shared successfully with the user\'s email address'
        }),
        [EditorMessageKey.LAST_SAVE]: Object.freeze({
            'text': 'The last content saved online was '
        }),
        [EditorMessageKey.CITE_WARNING_ALERT]: Object.freeze({
            'text': 'Please place the cursor in the text where the reference citation should appear.'
        }),
        [EditorMessageKey.CUR_OPT_REVERT_ERROR]: Object.freeze({
            'text': 'This section is locked for editing. Please use the comments function instead and the changes will be made for you.'
        }),
        [EditorMessageKey.DELETE_MUTLI_PARA]: Object.freeze({
            'text': 'Note! Multiple para/element not allowed to delete.'
        }),
        [EditorMessageKey.ERROR_HYPERLINK]: Object.freeze({
            'text': 'This section is locked for editing. Please use the comments function instead and the changes will be made for you.',

        }),
        [EditorMessageKey.ERROR_INSERT_MATH]: Object.freeze({
            'text': 'This section is locked for editing. Please use the comments function instead and the changes will be made for you.',
        }),
        [EditorMessageKey.SELECT_ALL]: Object.freeze({
            'text': 'Please do not use the &ldquo;Ctrl+A&rdquo; shortcut to select all the document content.',

        }),
        [EditorMessageKey.FIND_REPLACE_IGNORE]: Object.freeze({
            'text': 'This section is locked for editing. Please use the comments function instead and the changes will be made for you.'
        }),
        [EditorMessageKey.FIND_REPLACE_PASS]: Object.freeze({
            'text': ''
        }),
        [EditorMessageKey.SPECIFIED_TEXT]: Object.freeze({
            'text': 'No results found.'
        }),
        [EditorMessageKey.HYPERLINK_ALERT]: Object.freeze({ // ? Document version        
            'prompt': {
                'title': 'Hyperlink ',
                'text': 'y',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Restored!',
                'text': 'Great! Your document is restored successfully with the selected version.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'The current version retained. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.RE_STORE_HTML]: Object.freeze({ 
            /*
            Please note that Undo (Ctrl+z) function will not be allowed after restoration. Do you want to continue?
            After restoring the versions, you are not allowed to Undo the activity again. Do you want to continue?
            You will lose the latest changes to the document on restoring the previous version. Do you want to continue?
            */
            'prompt': {
                'title': 'Restore Version',
                'text': 'Please note that you will not be able to undo after the content gets restored. ##br## ##br## Do you wish to continue?',
                'icon': 'warning',
                'okText': 'Yes',
                'canText': 'No'
            },
            'success': {
                'title': 'Restored!',
                'text': 'Great! Your document is restored successfully with the selected version.',
                'icon': 'success'
            },
            'cancel': {
                'title': 'Cancelled!',
                'text': 'The current version retained. :)',
                'icon': 'error'
            }
        }),
        [EditorMessageKey.REVERT_HTML]: Object.freeze({
            'text': 'Great! Your document is restored successfully with the selected version.'
        }),
        [EditorMessageKey.POPUP_BLOCKER]: Object.freeze({
            'text': 'Kindly disable your pop-up blocker and click the &ldquo;Open&rdquo; link again.'
        }),
        [EditorMessageKey.POPUP_BLOCKER_NEW]: Object.freeze({
            'title': 'Warning',
            'text': `Please note that your system has a pop-up blocker enabled due to browser settings. If you encounter difficulty downloading the file, kindly copy the provided link and paste it into a new browser tab to access the document. <br><br><a href="{{url}}" target="_blank"><button class="btn btn-danger btn-sm font-weight-bold">Click Here</button></a><br><br> <span class="break-line">{{url}}</span>`,
            "type": "warning",
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),

        [EditorMessageKey.RESTORE_NO_HTML_FILE]: Object.freeze({
            'text': 'Sorry! No versions were found to restore the document.'
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_XREFS]: Object.freeze({
            'text': 'You are trying to delete a content that contains citations. To remove the cited text, simply follow these steps: <br><br>(1) Identify the blue-colored text which represents the cited content. <br>(2) Right-click on the blue-colored text and choose the "Delete Citation" option. <br>(3) Once the citation is removed, you can delete the cited text from the content. If you need more guidance, please refer to the &ldquo;Delete Citation&rdquo; section in the help guide.'
        }),
        [EditorMessageKey.ALLOWED_DELETE_CITE]: Object.freeze({
            'text': `The content you deleted includes citations to {{text}}. These items appear only once in the entire document.<br>Please ensure these citations are added elsewhere to avoid errors during finalization. To reinsert a citation, you can right-click and choose the appropriate citation option for that element.<br>If this deletion was unintentional, you can Undo it (Ctrl + Z or Command + Z).`
        }),
        [EditorMessageKey.LAST_CHAR]: Object.freeze({
            'text': 'Please use the context menu option to delete the entire word or phrase from the '
        }),
        [EditorMessageKey.ALT_TEXT]: Object.freeze({
            'text': 'Please begin entering the Alt-Text for this figure at the current cursor location.<br><br>Note: Providing an Alt-Text description for the figure is optional.'
        }),
        [EditorMessageKey.COMMON_PLACEHOLDER]: Object.freeze({
            'text': 'Please begin entering the {{text}} at the current cursor location.'
        }),
        [EditorMessageKey.TABLE_ROW_COL]: Object.freeze({
            'text': 'Total number of Rows/Columns should not exceed more than 25.'
        }),
        [EditorMessageKey.PASTE_SHORTCUT]: Object.freeze({
            'text': 'Please use shortcut key Ctrl-V/Ctrl+Shift+V for paste.'
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_NOTE_QRY]: Object.freeze({
            'text': 'Note! You are not allowed to delete Queries and Comments along with the content.'
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_MATH_RETAIN]: Object.freeze({
            'text': 'The content you&rsquo;re attempting to delete contains equations. For your information, only the text portion will be removed upon deletion, while the equations will remain in place.',
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_MATH]: Object.freeze({
            'text': 'Please avoid using shortcuts such as Delete, Backspace, or Ctrl+X to remove equations.'
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_FM]: Object.freeze({
            'title': 'Warning',
            'text': 'This section is locked for editing. Please use the comments function instead and the changes will be made for you.',
            "type": "warning",
            "button1": "", 
            "button2": "OK",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_P_MERGE]: Object.freeze({
            'text': 'Note! You are not allowed to delete merged paragraph markers along with the content.'
        }),
        [EditorMessageKey.IGNORE_KEY_EVENT_LINK]: Object.freeze({  // ? Sean Request Alert message change - 3207261
            'title': 'Warning',
            'text': 'To modify the hyperlink text, right-click and choose "Edit Link" from the context menu. Enter the desired text in the "Display Text" field, should you additionally wish to change the link destination please edit the "Link" field and apply your changes. Direct editing of hyperlink text is not allowed.',
            "type": "warning",
            "button1": "",
            "button2": "OK",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.IGNORE_HYPERLINK_TEXT]: Object.freeze({
            'text': 'You cannot delete hyperlinked text directly. Please follow the steps below to remove it: <br><br>(1) Right-click on the hyperlinked text and Select the "Remove Link" option to remove the hyperlink. <br>(2) Once the link is removed, select the desired text. <br>(3) Use the Backspace or Delete key to remove the text from the editor.'
        }),
        [EditorMessageKey.CLOSE_WITHOUT_REPLY]: Object.freeze({
            'text': 'You were typing something. Do you wish to close?'
        }),
        [EditorMessageKey.SUPPL_CLOSE_DIALOG]: Object.freeze({
            'title': 'Add / Replace file',
            'text': 'You have an unsaved file upload. Exiting will discard it. Do you want to leave without submitting?',
            "type": "warning",
            "button1": "Yes",
            "button2": "No",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.DELETE_COMMAND_ONE]: Object.freeze({
            'title': 'Delete Comment',
            'text': 'Are you sure you want to delete your posted comment?',
            "type": "warning",
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.DELETE_COMMAND_OTHER]: Object.freeze({
            'title': 'Delete Comment',
            'text': 'Are you sure you want to delete this comment?',
            "type": "warning",
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.DELETE_COMMAND_OTHER_ALL]: Object.freeze({
            "title": "Delete Comment",
            "text": "Are you sure you want to delete this comment? This action will remove the entire conversation related to it. Confirm your action below.",
            "type": "warning",
            "button1": "Delete Conversation",
            "button2": "Cancel",
            "param": true,
            "Options": {
                "hide": true
            }
        }),
        [EditorMessageKey.DELETE_COMMAND_ALL]: Object.freeze({
            'title': 'Delete Comment',
            'text': 'Are you sure you want to proceed with deleting comments? You can choose to delete all conversation of this comments or just your own comment. Confirm your choice below.',
            "type": "warning",
            "button1": "Delete Conversation",
            "button2": "Cancel",
            "button3": "Delete My Comment",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.FIND_CYCLIC]: Object.freeze({
            'text': 'We have reached the end of the document. Do you want to try searching from the beginning?'
        }),
        [EditorMessageKey.FIND_ENDED]: Object.freeze({
            'text': 'We are finished searching the document.'
        }),
        [EditorMessageKey.LWW_FIGURE_SIZE_ERR]: Object.freeze({
            'text': 'File size exceeds 100MB limit. Please contact "<strong>{{journalEmail}}</strong>" to upload your replacement file(s) using another method.'
        }),
        [EditorMessageKey.SINGLE_UPLOAD_SIZE_ERR]: Object.freeze({
            // ? Mantis_ID 1798594: size 30 to 100MB
            'text': 'Make sure the file size doesn&rsquo;t exceed 100 MB.'
        }),
        [EditorMessageKey.MULTI_UPLOAD_SIZE_ERR]: Object.freeze({ 
            // ? Mantis_ID 1798594: size 100 to 500MB
            'text': 'Please ensure the file size remains below 500 MB. To continue, you may need to remove some files.'
        }),
        [EditorMessageKey.UPLOAD_SIZE_BIG]: Object.freeze({
            'text': 'The file size is too large. So, it will take time to save. Please be patient until upload.'
        }),
        [EditorMessageKey.UPLOAD_INVALID_ERR]: Object.freeze({
            'text': 'Incorrect file format. Please check and upload.'
        }),
        /*  (Allowed formats are jpg, jpeg, png, gif, tif, tiff, bmp, docx, xlsx, pptx, pdf).  */
        [EditorMessageKey.REPLACE_IMAGE_ERR]: Object.freeze({
            'text': 'Incorrect file format. (Allowed formats are jpg, jpeg and png). Please check and upload.'
        }),
        [EditorMessageKey.CITE_INSERT_COMMON]: Object.freeze({
            'text': 'The citation has been added successfully to the text.',
        }),
        /* REFERENCES */
        [EditorMessageKey.REF_DELETE]: Object.freeze({
            'text': 'The citation has been deleted from the text and the reference list successfully.'
        }),
        [EditorMessageKey.REF_DEL_RE_NUM]: Object.freeze({
            'text': 'The citation has been deleted from the text and the reference list and renumbered successfully.',
        }),
        [EditorMessageKey.CITE_DEL_NOTE]: Object.freeze({
            'text': " Please review the content around the deleted text and rephrase as necessary.",
            'from': 'Reference citation removed in text. Please review the content around the deleted text and rephrase as necessary.'
        }),
        [EditorMessageKey.REF_CITE_DEL]: Object.freeze({
            'text': 'The citation has been deleted successfully from the text.',
        }),
        [EditorMessageKey.REF_CITE_DEL_RE_NUM]: Object.freeze({
            'text': 'The citation has been deleted from the text and the reference list and renumbered successfully.'
        }),
        [EditorMessageKey.REF_CITE_INS_RE_NUM]: Object.freeze({
            'text': 'The citation has been added from the text and the reference list and has been renumbered successfully.',
        }),
        [EditorMessageKey.REF_INSERT]: Object.freeze({
            'text': 'The citation has been added to the text and reference list successfully.'
        }),
        [EditorMessageKey.REF_INSERT_ONLY]: Object.freeze({
            'text': 'The reference has been added to the reference list successfully.'
        }),
        [EditorMessageKey.REF_INSERT_WITH_RE_ORDER_NOTE]: Object.freeze({
            // ? 1996643: Inserting references pop-up
            'text': 'The reference you have inserted will be added to the end of the reference list, and the reordering of references will be managed by the collation team before online publication.',
        }),
        [EditorMessageKey.COMMON_CITE_MISS]: Object.freeze({
            'text': '<br><br>Renumbering is not excuted due to a missing citations [{{miss_cite}}] in the article. Kindly include the missing citations to initiate an automatic renumbering of the references. To insert the missing citations, follow these steps: (1) Position the cursor where you want to insert the citation. (2) Right-click and choose "Insert Citation" from the context menu. (3) Select the appropriate citation from the Reference list. (4) Click "Insert" to link the citation.',
        }),
        [EditorMessageKey.REF_INS_RE_NUM]: Object.freeze({
            'text': 'The citation has been added to the text and reference list, and have been renumbered successfully.'
        }),
        [EditorMessageKey.REF_CITE_INS_WITH_RE_NUMBER]: Object.freeze({
            'text': 'The Citation is added and References list has been renumbered successfully.'
        }),
        [EditorMessageKey.REF_LISTAND_CITATION_RE_NUMBER]: Object.freeze({
            'text': 'The Reference is added/deleted to the list and were renumbered successfully.'
        }),
        /*  Ignore */
        [EditorMessageKey.REF_LIST_RE_NUMBER]: Object.freeze({
            'text': 'The references list has been renumbered successfully.'
        }),
        [EditorMessageKey.REF_LIST_RE_ORDER]: Object.freeze({
            'text': 'The references list has been re-ordered successfully.'
        }),
        /* REQUEST ALERT */
        [EditorMessageKey.REQ_MSG_NULL]: Object.freeze({
            'text': 'The message can\'t be null. So, the requested user won\'t get any notification.'
        }),
        [EditorMessageKey.SIGN_OFF_RE_DIRECT]: Object.freeze({
            "type": "warning",
            "title": "Finalised",
            'text': 'Document link has been finalised and will be available in read only mode.',
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.SIGN_OFF_SURVEY]: Object.freeze({
            "type": "warning",
            "title": "Finalised",
            'text': `To help us improve the author experience, we would be grateful if you could take 1 or 2 minutes to answer a short survey about your experience with the IMPACT proofing tool today.`,
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.SIGN_OFF]: Object.freeze({
            'text': `The proof link has been signed off. You can access the {{DOC_TYPE}} in read-only mode.`
        }),
        [EditorMessageKey.EXPIRED]: Object.freeze({
            'text': `The user document link is already expired and will be open with read-only mode.`
        }),
        [EditorMessageKey.FILE_DELETED]: Object.freeze({
            'text': `The proofing link is expired. If you have not downloaded your proof, please contact &ldquo;<a class="font-weight-bold email-text" href="mailto:{{MAIL}}">{{TEXT}}</a>&rdquo;.`
        }),
        [EditorMessageKey.REQ_DENIED]: Object.freeze({
            "type": "error",
            "title": "Request Denied!",
            'text': 'You don\'t have access to open the link.',
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.LINK_OPENED]: Object.freeze({
            /* Link is already opened in another tab. Please check. */
            'text': 'Link has been already opened in another tab. Please check.'
        }),
        /* ? 03-_OCT_22 SIVA_SRINI_CLIENT_UPDATE */
        [EditorMessageKey.LINK_OPENED_RE_DIRECT]: Object.freeze({
            'text': 'Link has been already opened in another tab. This page will be open with read-only mode.'
        }),
        [EditorMessageKey.LINK_OPENED_CLOSE_TAB]: Object.freeze({
            'text': 'Link has been already opened in another tab. Please check.'
        }),
        [EditorMessageKey.EXPIRED_SESSION_ALERT]: Object.freeze({
            "type": "warning",
            "title": "Session Expired",
            'text': 'Your session is already expired or has been opened in another browser/tab. Kindly continue from the landing page again.',
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.REQUEST_DIALOG]: Object.freeze({
            'text': '<p>You have received a new request to access this proof link.<br>Press &ldquo;Accept&rsquo; to approve the request or &ldquo;Reject&rsquo; to cancel. <br><span style="color:#EB0001;padding-top: 16px;font-weight: 500;">This dialogue box will close in <span id="seconds-timer"></span> seconds.</span></p>'
        }),
        [EditorMessageKey.LOG_OUT_SHOW]: Object.freeze({
            "type": "warning",
            "title": "Log out?",
            'text': 'You have not finalized the proof yet. Do you still want to log out?',
            "button1": "Log out",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.LOG_OUT_SHOW_COROLE]: Object.freeze({
            "type": "warning",
            "title": "Log out?",
            'text': 'Do you want to log out?',
            "button1": "Log out",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.IDLE_SESSION_ALERT]: Object.freeze({
            "title": "Session Timeout",
            "type": "warning",
            'text': 'Your session is nearing expiration. You will be automatically logged out in <span id="alert-timer">30</span> seconds. <br><br>Click &ldquo;Continue Session&rdquo; to keep the session active',
            "button1": "Continue Session",
            "button2": "",
            "param": true
        }),
        [EditorMessageKey.LOG_OUT_IDLE_INFO]: Object.freeze({
            "type": "warning",
            "title": "Session ended",
            'text': 'There was no activity for a while. Your session will be closed.',
            "button1": "Start new session",
            "button2": "",
            "param": true,
            "Options": {
                hide: false
            }
        }),
        [EditorMessageKey.LINK_TEXT_URL_MATCH]: Object.freeze({
            "type": "warning",
            "title": "Warning",
            'text': `The display text does not match the provided {{linktype}}. Are you sure you want to continue with your changes?`,
            "button1": "Yes",
            "button2": "No",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.IMPACT_EDIT_INFO]: Object.freeze({
            "type": "info",
            "title": "Reminder",
            'text': `We would like to remind you that our tool enables direct editing of the article. If possible, please consider making corrections directly via the Editor View for insertions, deletions, and formatting adjustments to the content. This contributes to a seamless and efficient editing process.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.IMPACT_EDIT_INFO_BOOK]: Object.freeze({
            "type": "info",
            "title": "Reminder",
            'text': `We would like to remind you that our tool enables direct editing of the document. If possible, please consider making corrections directly via the Editor View for insertions, deletions, and formatting adjustments to the content. This contributes to a seamless and efficient editing process.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.ABS_MIN_REACHED]: Object.freeze({
            "type": "error",
            "title": "Abstract Words",
            'text': `Kindly note that the abstract word count of the article is below the minimum required limit.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.ABS_MAX_REACHED]: Object.freeze({
            "type": "error",
            "title": "Abstract Words",
            'text': `Abstract word count has reached the maximum limit. Adding content beyond this limit is not allowed.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.ABS_MAX_NEARED]: Object.freeze({
            "type": "warning",
            "title": "Abstract Words",
            'text': `The abstract word count has reached 90% of the maximum limit.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.ABS_FINALIZE_ALERT]: Object.freeze({
            "type": "warning",
            "title": "Abstract Words",
            'text': `The abstract word count exceeds the maximum limit. Please remove excess words to meet the required limit and finalize the article.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.MATH_ERROR]: Object.freeze({
            "type": "info",
            "title": "Math Editing - Technical Error",
            'text': `An issue has arisen while attempting to open the equation for editing. Please provide your corrections using the comments feature within the pop-up text box, which is open behind this message window.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.BOOK_END_NOTE]: Object.freeze({
            "type": "info",
            "title": "Book Endnotes",
            'text': `The document follows book-style endnotes. Please provide your corrections using the comments feature in the pop-up text box, which is open behind this message window.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.ERROR_AUTO_SHARE_MAIL]: Object.freeze({
            'text': 'Oops! Error while sharing the link to the author. Kindly contact the support team for assistance.'
        }),
        [EditorMessageKey.WRITE_MAIL_TO_TEAM]: Object.freeze({
            'text': `The mail has been sent successfully to {{TEXT}}. The support team will contact you shortly.`
        }),
        [EditorMessageKey.INVALID_MAIL]: Object.freeze({
            'text': 'Invalid e-Mail.'
        }),
        [EditorMessageKey.MULTI_MAIL]: Object.freeze({
            'text': 'Note! More than one e-Mail not allowed.'
        }),
        [EditorMessageKey.EMAIL_LIMIT_REACHED]: Object.freeze({
            'text': 'Only {{allowedCount}} e-Mail(s) were added. {{overflowCount}} extra e-Mail(s) were ignored because the maximum limit is {{limit}}.'
        }),
        [EditorMessageKey.OWN_EMAIL_SKIPPED]: Object.freeze({
            'text': 'Your own e-Mail address was skipped and not added.'
        }),
        [EditorMessageKey.INSTRUCT_USER_MAIL]: Object.freeze({
            'text': 'Please note: responses will take one working day. Please refer to the <a class="blue-text font-weight-bold" tabindex="0" href="javascript:iDownloadMethod.click(\'Help_FAQ_pdf\')">FAQs</a> or <a class="blue-text font-weight-bold" tabindex="0" href="javascript:iDownloadMethod.click(\'Help_Guide_pdf\')">User Guide</a> for quicker support.'
        }),
        [EditorMessageKey.CONTEXT_MENU_CLIK]: Object.freeze({
            'text': 'Note! Mouse right-click disabled here. Please use shortcut keys to copy (Ctrl+C) the content from the page.'
        }),
        [EditorMessageKey.INSERT_COMMENT_RESTRICT]: Object.freeze({
            'text': 'Please place the cursor in the text where the comment should appear.'
        }),
        [EditorMessageKey.INSERT_COMMENT]: Object.freeze({
            'text': 'Since cursor is not placed in editor. Comment is inserted before the title.'
        }),
        [EditorMessageKey.INSERT_EMPTY_COMMON]: Object.freeze({
            "text": "The instruction or response was not inserted because the input field is empty."
        }),
        [EditorMessageKey.INSERT_EMPTY_COMMENT]: Object.freeze({
            "text": "Comment cannot be empty ΓÇö please enter text to add your comment."
        }),
        [EditorMessageKey.INSERT_EMPTY_QUERY]: Object.freeze({
            "text": "Query response cannot be empty ΓÇö please add your reply."
        }),
        [EditorMessageKey.CMD_REQUIRED_CONTENT]: Object.freeze({
            'text': `Please enter at least {{MIN_CONTENT_LENGTH}} characters.`
        }),
        [EditorMessageKey.CMD_REQUIRED_ATTACHMENT]: Object.freeze({
            'text': `Please attach at least one file before submitting.`
        }),
        [EditorMessageKey.CMD_SINGLE_ATTACHMENT_ONLY]: Object.freeze({
            'text': `Only one attachment is allowed. Please remove extras.`
        }),
        [EditorMessageKey.INVALID_CURSOR]: Object.freeze({
            'text': 'Kindly set the cursor on Editor view and try again.'
        }),
        [EditorMessageKey.IGNORE_FULL_FORMAT]: Object.freeze({                        
            'text': 'Kindly Note! Formatting and content deletion are not allowed for the entire paragraph.'
        }),
        [EditorMessageKey.IGNORE_PASTE_FULL_TEXT]: Object.freeze({
            'text': 'Pasting is disabled when the entire paragraph/table is selected.'
        }),
        [EditorMessageKey.IGNORE_REF_ACTION]: Object.freeze({
            'text': 'To edit the reference, right-click and select &ldquo;Edit Reference&rdquo;. To delete the reference, right-click and select &ldquo;Delete Reference&rdquo;. To raise a comment right-click and select &ldquo;Add Comment&rdquo;',
        }),
        [EditorMessageKey.ERROR_IMPACT]: Object.freeze({
            'text': 'Oops! Something went wrong. Please be patient till the page refresh.'
        }),
        [EditorMessageKey.DIALOG_OPENED]: Object.freeze({
            'text': 'Please close the existing dialog window to open the new dialog window.'
        }),
        [EditorMessageKey.ORCID_ADDED]: Object.freeze({
            'text': 'ORCID added successfully.'
        }),
        [EditorMessageKey.ORCID_UPDATED]: Object.freeze({
            'text': 'ORCID updated successfully.'
        }),
        [EditorMessageKey.WRONGPAGE]: Object.freeze({
            'text': 'No page found.'
        }),
        [EditorMessageKey.PART_LABEL_REACH_OVERLIMIT]: Object.freeze({
            'text': 'The label should not exceed more than 30 characters.'
        }),
        [EditorMessageKey.PART_LABEL_PATTERN_NOT_MATCH]: Object.freeze({
            'text': 'The label doesn\'t match the patterns. Kindly follow the patterns to represent. (E.g., A, B, or A-C).'
        }),
        [EditorMessageKey.QUERY_COUNT_MISMATCH]: Object.freeze({
            'text': "Your document query count is mismatched and you are unable to proceed. Kindly contact the support team for assistance."
        }),
        [EditorMessageKey.EMPTY_CONTENT]: Object.freeze({
            'text': "Empty content not allowed to insert."
        }),
        [EditorMessageKey.UNDER_DEVELOPMENT]: Object.freeze({
            'text': 'Sorry, this function is under development. Kindly try back once confirmed by developement team.'
        }),
        /* 22_MAY_2023 */
        [EditorMessageKey.E_PAGE_IMAGE_ANNO_REPLACE]: Object.freeze({
            "type": "warning",
            "title": "Warning",
            'text': `Annotations has been made in this image. Do you want to replace it?`,
            "button1": "Yes",
            "button2": "No",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.SCH_MAINTENANCE]: Object.freeze({
            'text': "Kindly note that we will be experiencing server downtime due to scheduled maintenance from <span class='font-weight-bold'>{{T1}}&#x000a0;{{T1A}}</span> to <span class='font-weight-bold'>{{T2}}&#x000a0;{{T1A}}</span> (in your local time)."
        }),
        [EditorMessageKey.CHINESE_CHAR]: Object.freeze({
            'text': 'We have encountered a discrepancy in the Chinese character count between the input and output documents. Please identify and remove these extra Chinese characters from the document before collation process.'
        }),
        [EditorMessageKey.CHINSES_CONTACT_SUPPORT]: Object.freeze({
            'text': `A technical issue with the East Asian character count is preventing proofing. This may be due to a translator plugin.<br><br>We&rsquo;ve notified our technical team and copied you on the email. Our support team will update you once it&rsquo;s fixed &mdash; usually within 24 hours.`
        }),
        [EditorMessageKey.CHINSES_CONTACT_SUPPORT_RESTORE]: Object.freeze({
            'text': `A technical issue with the East Asian character count is preventing proofing. This may be caused by a translator plugin.<br><br>If no corrections are found, you can restore the original version using the &ldquo;Restore dialog&rdquo;.<br><br>If you wish to notify our technical team, click &ldquo;Contact Support Team.&rdquo; You will be copied on the email, and our support team will update you once it&rsquo;s fixed &mdash; usually within 24 hours.`
        }),
        [EditorMessageKey.INTERNAL_SURVEY]: Object.freeze({
            'text': 'Are you sure you want to quit? Your feedback helps us improve our products and services.'
        }),
        [EditorMessageKey.CITE_CLK_WARN]: Object.freeze({
            "type": "warning",
            "title": "Warning",
            'text': 'Please avoid directly modifying the cited text. Instead, right-click and select "Edit Citation" to link the desired reference from the list for updates.',
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.FORMAT_REF_WARN]: Object.freeze({
            "type": "warning",
            "title": "Warning",
            'text': "Please note that formatting (such as Bold, Italic, Roman, etc.) for this element is not allowed, as it will be automatically applied in the proof according to the journal\'s style guidelines. If changes are needed, please provide instructions using the comment option.",
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.SINGLE_FLOAT_CITE]: Object.freeze({
            "text": 'The citation you are attempting to delete is currently referred in only one location within the document and is directly linked to a specific figure/table. Before proceeding with the deletion, please make sure you have cited it appropriately elsewhere.<br><br>Follow these steps to include a citation:<br>(1) Place the cursor where you want to add the citation.<br>(2) Right-click and select &ldquo;Insert Citation&rdquo; from the context menu.<br>(3) Choose the relevant citation from the list of figures/tables.<br>(4) Click &ldquo;Insert&rdquo; to link the citation.'
        }),
        [EditorMessageKey.DEL_EDIT_DIALOG]: Object.freeze({
            "text": `This citation includes multiple references. Do you want to delete '{{text}}' or remove specific one?<br>
        Note: To delete specific references, click Modify and uncheck the ones you wish to remove from the Cross Citation panel.`
        }),
        [EditorMessageKey.REF_IS_EXITS]: Object.freeze({
            "text": 'The DOI you are attempting to insert is already present in this article. Do you still wish to add it as a new reference'
        }),
        [EditorMessageKey.SUPPLY_DELETE]: Object.freeze({
            "title": "supply Delete Alert",
            "type": "warning",
            'text': 'delete',
            "button1": "yes",
            "button2": "cancel",
            "param": true
        }),
        [EditorMessageKey.MISS_GOTO_CITE]: Object.freeze({
            "text": `No matching citation found in the document.<br><br>Please use the following steps to insert the citation:<br><br>1. Select the citation content in the document.<br>2. Right-click and choose Insert Citation.<br>3. In the popup window, select the appropriate reference.`
        }),
        [EditorMessageKey.ERROR_RE_STORE_FOR_COLLAB]: Object.freeze({
            'text': 'This feature is not available for collaborative editing. Contact the support team for assistance.'
        }),
        [EditorMessageKey.ERROR_LOCKED_PARA_EDIT]: Object.freeze({
            'text': 'This paragraph is locked by another user. You cannot edit it until it is released.',
            "type": "warning",
            "title": "Warning",
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": { hide: true }
        }),
        [EditorMessageKey.DELETE_ATTACH_ONE]: Object.freeze({
            'title': 'Delete Attachment',
            'text': 'Are you sure you want to delete this attachment?',
            "type": "warning",
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.DELETE_ATTACH_ALL]: Object.freeze({
            'title': 'Delete All Attachment',
            'text': 'Are you sure you want to proceed with deleting all attachments?',
            "type": "warning",
            "button1": "Yes",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        }),
        [EditorMessageKey.REPLACE_IMAGE_2_COMMAND]: Object.freeze({
            "type": "info",
            "title": "Insert/Replace Image",
            'text': `Please provide your image replacement instructions/comments in the Comments pop-up window, which is open behind this message window, for further processing.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }),

});

export default EDITOR_MESSAGES;
