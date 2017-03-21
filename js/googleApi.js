const googleUrl = 'https://maps.google.com/maps/api/geocode/json';

function format(raw) {
	const address = {
		position: {},
		formattedAddress: raw.formatted_address || '',
		feature: null,
		streetNumber: null,
		streetName: null,
		postalCode: null,
		locality: null,
		country: null,
		countryCode: null,
		adminArea: null,
		subAdminArea: null,
		subLocality: null,
	};

	if (raw.geometry && raw.geometry.location) {
		address.position = {
			lat: raw.geometry.location.lat,
			lng: raw.geometry.location.lng,
		}
	}

	raw.address_components.forEach(component => {
		if (component.types.indexOf('route') !== -1) {
			address.streetName = component.long_name;
		}
		else if (component.types.indexOf('street_number') !== -1) {
			address.streetNumber = component.long_name;
		}
		else if (component.types.indexOf('country') !== -1) {
			address.country = component.long_name;
			address.countryCode = component.short_name;
		}
		else if (component.types.indexOf('locality') !== -1) {
			address.locality = component.long_name;
		}
		else if (component.types.indexOf('postal_code') !== -1) {
			address.postalCode = component.long_name;
		}
		else if (component.types.indexOf('administrative_area_level_1') !== -1) {
			address.adminArea = component.long_name;
		}
		else if (component.types.indexOf('administrative_area_level_2') !== -1) {
			address.subAdminArea = component.long_name;
		}
		else if (component.types.indexOf('sublocality') !== -1 || component.types.indexOf('sublocality_level_1') !== -1) {
			address.subLocality = component.long_name;
		}
		else if (component.types.indexOf('point_of_interest') !== -1 || component.types.indexOf('colloquial_area') !== -1) {
			address.feature = component.long_name;
		}
	});

	return address;
}

let _additionalQueryParams = '';

export default {
	addParams(params) {
		if (!params) {
			throw new Error("You should specify params argument");
		}

		const paramsType = ({}).toString.call(params);
		if (paramsType === '[object Object]') {
			params = Object.keys(params).map((key) => {
				return `${key}=${params[key]}`;
			});
		} else if (paramsType !== '[object Array]') {
			throw new Error("Invalid params argument. Params should be string array of 'key=value' or an object");
		}

		for (let i = 0, l = params.length; i < l; i++) {
			const newParam = params[i];
			const key = newParam.split('=').shift() + '=';
			if (_additionalQueryParams.indexOf(key) === -1) {
				_additionalQueryParams += `&${newParam}`;
			}
		}
	},

	geocodePosition(apiKey, position) {
		if (!apiKey || !position || !position.lat || !position.lng) {
			return Promise.reject(new Error("invalid apiKey / position"));
		}

		return this.geocodeRequest(`${googleUrl}?key=${apiKey}&latlng=${position.lat},${position.lng}${_additionalQueryParams}`);
	},

	geocodeAddress(apiKey, address) {
		if (!apiKey || !address) {
			return Promise.reject(new Error("invalid apiKey / address"));
		}

		return this.geocodeRequest(`${googleUrl}?key=${apiKey}&address=${encodeURI(address)}${_additionalQueryParams}`);
	},

	async geocodeRequest(url) {
		const res = await fetch(url);
		const json = await res.json();

		if (!json.results || json.status !== 'OK') {
			return Promise.reject(new Error(`geocoding error ${json.status}, ${json.error_message}`));
		}

		return json.results.map(format);
	}
}
