async function init() {
    initTheme();
    await loadLibrary();
    initSearch();
}

window.onload = init;

const LIBRARY = [];

async function loadLibrary() {
    for (const file of bibtexFiles) {
        // Fetch bibtex
        const bibtex = await fetch('bibtex/' + file).then(response => response.text());
        // Parse to JSON
        const json = bibtexParse.toJSON(bibtex);
        // Add to library
        LIBRARY.push(...json);
    }

    // TODO: remove this, for testing only
    const content = document.getElementById('content');
    content.innerHTML = '';
    for (const entry of LIBRARY) {
        content.append(createHTMLBibtexEntry(entry));
    }
}

function toBibtex(entry) {
    // Wrap JSON in array and set compact to false
    return bibtexParse.toBibtex([entry], false);
}

function initSearch() {
    const input = document.getElementById('input-search');
    const divs = document.querySelectorAll('.bibtex-entry');
    input.addEventListener('input', function (event) {
        const text = normalizeString(input.value).toLowerCase();
        for (let i = 0; i < LIBRARY.length; ++i) {
            if (searchMatch(LIBRARY[i], text))
                divs[i].style.display = null;
            else
                divs[i].style.display = 'none';
        }
    });
}

function searchMatch(entry, text) {
    if (text.length == 0)
        return true;

    return normalizeString(entry?.entryTags?.title).toLowerCase().includes(text) || normalizeString(entry?.entryTags?.author).toLowerCase().includes(text);
}

function createHTMLBibtexEntry(entry) {
    const entryTags = entry.entryTags;

    const div = document.createElement('div');
    div.classList.add('bibtex-entry');

    if (entryTags.author) {
        const span = document.createElement('span');
        span.innerText = readableString(entryTags.author);
        span.classList.add('author');
        div.append(span);
    }

    if (entryTags.year) {
        const span = document.createElement('span');
        span.innerText = readableString(entryTags.year);
        span.classList.add('year');
        div.append(span);
    }

    if (entryTags.title) {
        const span = document.createElement('span');
        span.innerText = readableString(entryTags.title);
        span.classList.add('title');
        div.append(span);
        typeset(span);
    }

    if (entryTags.journal) {
        const span = document.createElement('span');
        span.innerText = readableString(entryTags.journal);
        span.classList.add('journal');
        div.append(span);
    }

    if (entryTags.pages) {
        const span = document.createElement('span');
        span.innerText = readableString(entryTags.pages);
        span.classList.add('pages');
        div.append(span);
    }

    if (entryTags.url) {
        const a = document.createElement('a');
        a.innerText = entryTags.url;
        a.href = entryTags.url;
        a.target = '_blank';
        a.classList.add('url');
        div.append(span);
    }

    {
        const copy = document.createElement('div');
        copy.classList.add('copy-code');
        copy.addEventListener('click', function () { setClipboard(toBibtex(entry)); });
        div.append(copy);
    }

    return div;
}

function typeset(elem) {
    // Typeset math
    renderMathInElement(elem, KaTeXOptions);
}

function readableString(str) {
    // Replace '--' by '–'
    str = str.replaceAll(/--/g, '–');
    // Remove surrounding '{' and '}'
    if (str[0] == '{' && str[str.length - 1] == '}')
        str = str.substring(1, str.length - 1);
    return str;
}

function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function setClipboard(text) {
    if (!navigator.clipboard) {
        alert('Browser does not support copying to clipboard.');
        return;
    }
    navigator.clipboard.writeText(text).then(function () { }, function (error) {
        alert(error);
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function initTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const cookieTheme = getCookie('theme');
    if (cookieTheme !== undefined)
        setTheme(cookieTheme === 'dark');
    else
        setTheme(false); // prefersDark
    document.getElementById('button-theme').addEventListener('click', function () {
        document.cookie = `theme=${setTheme() ? 'dark' : 'light'}`;
    });
    setTimeout(function () { // little hack to prevent initial transition, but it works
        const sheet = window.document.styleSheets[0];
        sheet.insertRule('body, input { transition: background-color 0.5s, color 0.5s; }', sheet.cssRules.length);
    }, 100);
}

function setTheme(dark) {
    if (dark === true) {
        document.body.classList.add('dark');
        return true;
    }
    if (dark === false) {
        document.body.classList.remove('dark');
        return false;
    }
    return setTheme(!document.body.classList.contains('dark'));
}
