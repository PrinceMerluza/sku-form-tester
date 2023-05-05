/**
 * Validates fields of a form.
 * Member 'errors' contain all the error messages. Where each key is the field name and the value
 * is an array of string error messages.
 */
export default class Validator {
	errors: { [key: string]: Array<string> };

	constructor(errors: { [key: string]: Array<string> }) {
		this.errors = errors;
	}

	addErrorMessage(key: string, message: string) {
		if (!this.errors[key]) {
			this.errors[key] = [];
		}
		this.errors[key].push(message);
	}

	validateStringLength(errorKey: string, value: string | undefined, min: number, max: number = Infinity, customMsg: string = '') {
		if (value === undefined) return;
		if (value.length >= min && value.length <= max) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `Length of "${errorKey}" should be between ${min} and ${max}`);
	}

	validateStringSuffix(
		errorKey: string,
		value: string | undefined,
		suffix: string,
		caseSensitive: boolean = false,
		customMsg: string = ''
	) {
		if (value === undefined) return;
		if (caseSensitive && value.trim().endsWith(suffix)) return;
		if (!caseSensitive && value.toLocaleLowerCase().trim().endsWith(suffix.toLocaleLowerCase())) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" should end with "${suffix}"`);
	}

	validateStringPrefix(
		errorKey: string,
		value: string | undefined,
		prefix: string,
		caseSensitive: boolean = false,
		customMsg: string = ''
	) {
		if (value === undefined) return;
		if (caseSensitive && value.trim().startsWith(prefix)) return;
		if (!caseSensitive && value.toLocaleLowerCase().trim().startsWith(prefix.toLocaleLowerCase())) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" should start with "${prefix}"`);
	}

	validateURL(errorKey: string, value: string | undefined, required: boolean = true, customMsg: string = '') {
		if (value === undefined) return;
		// If not required don't check URL if empty string
		if (!required && value.length <= 0) return true;

		const urlRegex =
			'^(?!mailto:)(?:(?:https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		const url = new RegExp(urlRegex, 'i');
		if (value.length < 2083 && url.test(value)) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" is not a valid URL. It should be an HTTPS website.`);
	}

	// Like validateURL but allows mailto addresses
	validateURI(errorKey: string, value: string | undefined, required: boolean = true, customMsg: string = '') {
		if (value === undefined) return;
		// If not required don't check URL if empty string
		if (!required && value.length <= 0) return true;

		const urlRegex =
			'^(mailto:.*@.*)|(?:(?:https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		const url = new RegExp(urlRegex, 'i');
		if (value.length < 2083 && url.test(value)) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" is not a valid URI (should be an HTTPS website or a mailto address)`);
	}

	validateEmail(errorKey: string, value: string | undefined, required: boolean = true, customMsg: string = '') {
		if (value === undefined) return;
		// If not required don't check URL if empty string
		if (!required && value.length <= 0) return true;

		const emailRegex = '^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$';
		const url = new RegExp(emailRegex, 'i');
		if (url.test(value)) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" is not a valid Email Address`);
	}

	validateStringContains(errorKey: string, value: string | undefined, contains: Array<string>, customMsg: string = '') {
		if (value === undefined) return;
		if (contains.every((c) => value.includes(c))) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" should contain the following string(s): ${contains}`);
	}

	validateNumberRange(errorKey: string, value: number | undefined, min: number, max: number, customMsg: string = '') {
		if (value === undefined || isNaN(value)) return;
		if (value >= min && value <= max) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" should be between ${min} and ${max}`);
	}

	validateGreaterThan(errorKey: string, num1: number | undefined, num2: number | undefined, customMsg: string = '') {
		if (num1 === undefined || num2 === undefined || isNaN(num1) || isNaN(num2)) return;
		if (num1 > num2) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `${num1} is less than or equal to ${num2}`);
	}

	validateGreaterThanOrEqual(errorKey: string, num1: number | undefined, num2: number | undefined, customMsg: string = '') {
		if (num1 === undefined || num2 === undefined || isNaN(num1) || isNaN(num2)) return;
		if (num1 >= num2) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `${num1} is less than ${num2}`);
	}

	validateLessThan(errorKey: string, num1: number | undefined, num2: number | undefined, customMsg: string = '') {
		if (num1 === undefined || num2 === undefined || isNaN(num1) || isNaN(num2)) return;
		if (num1 < num2) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `${num1} is greater than or equal to ${num2}`);
	}

	validateLessThanOrEqual(errorKey: string, num1: number | undefined, num2: number | undefined, customMsg: string = '') {
		if (num1 === undefined || num2 === undefined || isNaN(num1) || isNaN(num2)) return;
		if (num1 <= num2) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `${num1} is greater than ${num2}`);
	}

	validateUUID(errorKey: string, value: string | undefined, customMsg: string = '') {
		if (value === undefined) return;

		const uuidRegex = '^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$';
		const uuid = new RegExp(uuidRegex, 'i');
		if (uuid.test(value)) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" is not a valid UUID`);
	}

	validateBoolean(errorKey: string, value: boolean | undefined, expected: boolean, customMsg: string = '') {
		if (value === undefined || value === expected) return;

		if (customMsg) this.addErrorMessage(errorKey, customMsg);
		else this.addErrorMessage(errorKey, `"${errorKey}" should be ${expected}`);
	}
}
