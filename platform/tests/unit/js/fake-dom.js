'use strict';
/* Minimal DOM stand-in for node tests (enough for VeritrailTools / VeritrailReport rendering). */

function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(s) { return escapeText(s).replace(/"/g, '&quot;'); }

class Node {
  constructor(doc) { this.ownerDocument = doc; this.childNodes = []; this.parentNode = null; }
  appendChild(c) {
    if (c.nodeType === 11) { c.childNodes.slice().forEach((x) => this.appendChild(x)); c.childNodes = []; return c; }
    if (c.parentNode) { c.parentNode.removeChild(c); }
    c.parentNode = this; this.childNodes.push(c); return c;
  }
  removeChild(c) { this.childNodes = this.childNodes.filter((x) => x !== c); c.parentNode = null; return c; }
  get firstChild() { return this.childNodes[0] || null; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.childNodes = []; if (v !== '') { this.appendChild(this.ownerDocument.createTextNode(v)); } }
}

class Text extends Node {
  constructor(doc, data) { super(doc); this.nodeType = 3; this.data = String(data); }
  get textContent() { return this.data; }
  set textContent(v) { this.data = String(v); }
  get outerHTML() { return escapeText(this.data); }
}

class Fragment extends Node {
  constructor(doc) { super(doc); this.nodeType = 11; }
  get outerHTML() { return this.childNodes.map((c) => c.outerHTML).join(''); }
}

class Element extends Node {
  constructor(doc, tag) { super(doc); this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attributes = {}; this.listeners = {}; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  get className() { return this.attributes['class'] || ''; }
  set className(v) { this.attributes['class'] = v; }
  get id() { return this.attributes.id || ''; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  get innerHTML() { return this.childNodes.map((c) => c.outerHTML).join(''); }
  set innerHTML(_v) { throw new Error('innerHTML must not be used'); }
  get outerHTML() {
    const attrs = Object.keys(this.attributes).map((k) => ` ${k}="${escapeAttr(this.attributes[k])}"`).join('');
    const tag = this.tagName.toLowerCase();
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }
  querySelectorAll(sel) {
    // supports "tag" and ".class" only
    const out = [];
    const match = (e) => (sel[0] === '.' ? e.className.split(/\s+/).includes(sel.slice(1)) : e.tagName === sel.toUpperCase());
    const walk = (n) => n.childNodes.forEach((c) => { if (c.nodeType === 1) { if (match(c)) { out.push(c); } walk(c); } });
    walk(this);
    return out;
  }
}

class Document {
  createElement(t) { return new Element(this, t); }
  createTextNode(d) { return new Text(this, d); }
  createDocumentFragment() { return new Fragment(this); }
}

module.exports = { Document };
