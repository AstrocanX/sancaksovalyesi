// src/utils/FilterChecker.js

const filters = require('../filters');

const charMap = {
  a: 'a@4âäàáãåāăąα',
  b: 'b8ßβ',
  c: 'cç¢©(',
  d: 'dďđ',
  e: 'e3€èéêëēĕėęěε',
  i: 'i1!|ìíîïīĭįı',
  l: 'l1|!ĺļľł',
  o: 'o0òóôõöøōŏőœ',
  s: 's5$šșşß',
  t: 't7+ţťŧ',
  u: 'uµùúûüūŭůűų',
  w: 'wvvŵ',
  r: 'rřŗŕ',
  n: 'nñńņňŉŋ',
  m: 'm',
  y: 'y¥ýÿŷ',
  g: 'gğĝğġģ',
  z: 'zžźż',
  ç: 'çc¢©(',
  ı: 'ıi1!',
  ğ: 'ğg6',
  ö: 'öo0',
  ü: 'üuµ',
  ş: 'şs$'
};

function escapeForCharClass(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function createRegex(word) {
  let pattern = '';
  for (const char of word.toLowerCase()) {
    if (char === ' ') {
      pattern += '[\\s._-]*';
      continue;
    }

    const baseChar = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const chars = charMap[baseChar] ? escapeForCharClass(charMap[baseChar]) : escapeForCharClass(baseChar);
    pattern += `[${chars}][\\s._-]*`;
  }
  pattern = pattern.replace(/[\\s._-]*$/, '');

  // \b yerine özel sınır ekliyoruz çünkü Türkçe karakterler kelime sınırlarını kırabiliyor
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${pattern}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
}


function checkMessageForBadWords(content) {
  for (const [category, data] of Object.entries(filters)) {
    for (const word of data.words) {
      const regex = createRegex(word);
      if (regex.test(content)) {
        return {
          matched: true,
          category,
          muteTime: data.muteTime,
          severity: data.severity
        };
      }
    }
  }

  return { matched: false };
}

module.exports = checkMessageForBadWords;
