import { describe, it, expect } from 'vitest';
import {
  parseClientConfigXml,
  CLIENT_CONFIG_DEFAULTS
} from '../../../src/services/editorConfig/parseClientConfigXml.js';

function parseXml(xmlString) {
  return new DOMParser().parseFromString(xmlString, 'application/xml');
}

describe('parseClientConfigXml', () => {
  it('reads three-column layout mode and read-only mode from editor6Layout', () => {
    const doc = parseXml(
      '<root><item name="editor6Layout" editor6="three-column" read-only="minimal"></item></root>'
    );
    const result = parseClientConfigXml(doc);
    expect(result.layoutMode).toBe('three-column');
    expect(result.readOnlyLayoutMode).toBe('minimal');
  });

  it('reads figCap/tabCap from Generate_Items', () => {
    const doc = parseXml(
      '<root><item name="Generate_Items" figCap="Fig." tabCap="Table"></item></root>'
    );
    const result = parseClientConfigXml(doc);
    expect(result.figCap).toBe('Fig.');
    expect(result.tabCap).toBe('Table');
  });

  it('returns defaults when editor6Layout/Generate_Items nodes are missing', () => {
    const doc = parseXml('<root><item name="something-else"></item></root>');
    expect(parseClientConfigXml(doc)).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('returns defaults without throwing when given null', () => {
    expect(parseClientConfigXml(null)).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('returns defaults without throwing when given a non-Document value', () => {
    expect(parseClientConfigXml({})).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('leaves layoutMode at default when editor6 attribute is not three-column', () => {
    const doc = parseXml('<root><item name="editor6Layout" editor6="default"></item></root>');
    expect(parseClientConfigXml(doc).layoutMode).toBe('default');
  });
});
