{
	"translatorID": "1a2e7c83-e130-495f-a729-1dbf523f5733",
	"label": "CSV-CHIPS",
	"creator": "Kathryn-Miller",
	"target": "csv",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"displayOptions": {
		"exportCharset": "UTF-8xBOM",
		"exportNotes": true
	},
	"inRepository": true,
	"translatorType": 2,
	"lastUpdated": "2023-03-29 15:31:28"
}

var recordDelimiter = "\n",
	fieldDelimiter = ",",
	fieldWrapperCharacter = '"',
	replaceNewlinesWith = " ", // Set to `false` for no replacement
	valueSeparator = "; "; // For multi-value fields, like creators, tags, etc.
var normalizeDate = true; // Set to `false` if the date should be written as it is

// Exported columns in order of export
var exportedFields = [
	// "Important" metadata
	"itemType",
	"publicationYear",
	"creators/author",
	"title",
	"publicationTitle",
	"DOI",
	"url",
	"abstractNote",
	"date",
	"notes",
	"tags/own",
	"tags/automatic",
];

// Creators that should map to base type
var creatorBaseTypes = {
	interviewee: 'author',
	director: 'author',
	artist: 'author',
	sponsor: 'author',
	contributor: 'author',
	inventor: 'author',
	cartographer: 'author',
	performer: 'author',
	presenter: 'author',
	podcaster: 'author',
	programmer: 'author'
};

var exportNotes;
function doExport() {
	exportNotes = Zotero.getOption("exportNotes");
	// Until we fix UTF-8xBOM export, we'll write the BOM manually
	Zotero.write("\uFEFF");
	writeColumnHeaders();
	var item;
	while ((item = Zotero.nextItem())) {
		if (item.itemType == "note" || item.itemType == "attachment") continue;
		let line = '';
		for (let i = 0; i < exportedFields.length; i++) {
			line += (i ? fieldDelimiter : recordDelimiter)
				+ getValue(item, exportedFields[i]);
		}
		Zotero.write(line);
	}
}

var escapeRE = new RegExp(fieldWrapperCharacter, 'g');
function escapeValue(str) {
	if (typeof replaceNewlinesWith == 'string') {
		str = str.replace(/[\r\n]+/g, replaceNewlinesWith);
	}
	
	return str.replace(escapeRE, fieldWrapperCharacter + '$&');
}

function writeColumnHeaders() {
	var line = '';
	for (let i = 0; i < exportedFields.length; i++) {
		line += (i ? fieldDelimiter : '') + fieldWrapperCharacter;
		var label = exportedFields[i].split('/');
		switch (label[0]) {
			case 'creators':
				label = label[1];
				break;
			case 'tags':
				label = (label[1] == 'own' ? 'Manual Tags' : 'Automatic Tags');
				break;
			case 'attachments':
				label = (label[1] == 'url' ? 'Link Attachments' : 'File Attachments');
				break;
			default:
				label = label[0];
		}
		// Split individual words in labels and capitalize property
		label = label[0].toUpperCase() + label.substr(1);
		label = label.replace(/([a-z])([A-Z])/g, '$1 $2');
		
		line += escapeValue(label) + fieldWrapperCharacter;
	}
	Zotero.write(line);
}

function getValue(item, field) {
	var split = field.split('/'), value = fieldWrapperCharacter;
	switch (split[0]) {
		// Get key from URI (which on translation-server might just be the key)
		case 'key':
			value += item.uri.match(/([A-Z0-9]+)$/)[1];
			break;
		case 'publicationYear':
			if (item.date) {
				var date = ZU.strToDate(item.date);
				if (date.year) value += escapeValue(date.year);
			}
			break;
		case 'creators':
			var creators = [];
			for (let i = 0; i < item.creators.length; i++) {
				var creator = item.creators[i];
				var baseCreator = creatorBaseTypes[creator.creatorType];
				if (creator.creatorType != split[1] && baseCreator !== split[1]) {
					continue;
				}
				creators.push(creator.lastName
					+ (creator.firstName ? ', ' + creator.firstName : ''));
			}
			value += escapeValue(creators.join(valueSeparator));
			break;
		case 'tags':
			var tags = [];
			var tagType = split[1] == 'automatic' ? 1 : 0;
			for (let i = 0; i < item.tags.length; i++) {
				if ((item.tags[i].type || 0) === tagType) {
					tags.push(item.tags[i].tag);
				}
			}
			value += escapeValue(tags.join(valueSeparator));
			break;
		case 'attachments':
			var paths = [];
			for (let i = 0; i < item.attachments.length; i++) {
				if (split[1] == 'path') {
					paths.push(item.attachments[i].localPath);
				}
				else if (split[1] == 'url' && !item.attachments[i].localPath) {
					paths.push(item.attachments[i].url);
				}
			}
			value += escapeValue(paths.join(valueSeparator));
			break;
		case 'notes':
			if (!exportNotes) break;
			var notes = [];
			for (let i = 0; i < item.notes.length; i++) {
				notes.push(item.notes[i].note);
			}
			value += escapeValue(Zotero.Utilities.unescapeHTML(notes.join(valueSeparator)));
			break;
		case 'date':
			if (item.date) {
				var dateISO = ZU.strToISO(item.date);
				if (normalizeDate && dateISO) {
					value += dateISO;
				}
				else {
					value += item.date;
				}
			}
			break;
		default:
			if (item[field] || (item.uniqueFields && item.uniqueFields[field])) {
				value += escapeValue('' + (item[field] || (item.uniqueFields && item.uniqueFields[field])));
			}
	}
	return value + fieldWrapperCharacter;
}








/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
