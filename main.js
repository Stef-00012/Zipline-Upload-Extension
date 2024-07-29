chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install") {
		await chrome.storage.local.set({
			ziplineUrl: "UNSET",
			ziplineToken: "UNSET",
			ziplineImageMaxViews: '',
			ziplineImageExpires: 'never',
			ziplineImageCompression: "0",
			ziplineFileNameFormat: "random",
			ziplinePassword: '',
			ziplineOverrideDomain: "",
			ziplineZeroWidthSpaces: "no",
			ziplineNoJSON: "no",
			ziplineEmbed: "yes",
			ziplineOriginalName: "no",
		});
	}
});

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "Zipline_Upload_Image",
		title: "Upload Image to Zipline",
		contexts: ["image"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Upload_Video",
		title: "Upload Video to Zipline",
		contexts: ["video"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Upload_Audio",
		title: "Upload Audio to Ziline",
		contexts: ["audio"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Upload_Text",
		title: "Upload Text to Zipline",
		contexts: ["selection"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Shorten_URL",
		title: "Shorten URL with Zipline",
		contexts: ["link"],
	});

	chrome.contextMenus.create({
		id: "Advanced_Zipline_Shorten_URL",
		title: "Shorten URL with Zipline (Advanced Options)",
		contexts: ["link"],
	});
});

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

chrome.contextMenus.onClicked.addListener(async (info) => {
	switch (info.menuItemId) {
		case "Zipline_Upload_Image": {
			if (!urlRegex.test(info.srcUrl)) {
				const formData = await convertToFormData(info.srcUrl)
			
				return await uploadToZipline(formData);
			}

			const granted = await chrome.permissions.request({
				origins: [convertLink(info.srcUrl)]
			})


			if (!granted) return chrome.notifications.create({
				title: "Error",
				message: "Image upload cancelled, permission to website denied.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			const formData = await convertToFormData(info.srcUrl)
			
			await uploadToZipline(formData);

			break;
		}

		case "Zipline_Upload_Video": {
			if (!urlRegex.test(info.srcUrl)) {
				const formData = await convertToFormData(info.srcUrl)
			
				return await uploadToZipline(formData);
			}
			
			const granted = await chrome.permissions.request({
				origins: [convertLink(info.srcUrl)]
			})

			if (!granted) return chrome.notifications.create({
				title: "Error",
				message: "Video upload cancelled, permission to website denied.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			const formData = await convertToFormData(info.srcUrl)
			
			await uploadToZipline(formData);

			break;
		}

		case "Zipline_Upload_Audio": {
			if (!urlRegex.test(info.srcUrl)) {
				const formData = await convertToFormData(info.srcUrl)
			
				return await uploadToZipline(formData);
			}

			const granted = await chrome.permissions.request({
				origins: [convertLink(info.srcUrl)]
			})

			if (!granted) return chrome.notifications.create({
				title: "Error",
				message: "Audio upload cancelled, permission to website denied.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			const formData = await convertToFormData(info.srcUrl)
			
			await uploadToZipline(formData);

			break;
		}

		case "Zipline_Upload_Text": {
			const blob = new Blob([info.selectionText], {
				type: "text/plain",
			});

			const formData = new FormData();
			formData.append("file", blob, `${new Date().toISOString()}.txt`);

			await uploadToZipline(formData);

			break;
		}

		case "Zipline_Shorten_URL": {
			await shortenWithZipline(info.linkUrl);

			break;
		}

		case "Advanced_Zipline_Shorten_URL": {
			await chrome.storage.local.set({
				shortenUrl: info.linkUrl
			})

			await chrome.action.setPopup({
				popup: 'popups/shorten/shorten.html'
			})

			await chrome.action.openPopup()

			break;
		}
	}
});

async function downloadFile(url) {

	const response = await fetch(url);
	const blob = await response.blob();

	return blob;
}

async function uploadToZipline(formData) {
	let {
		ziplineUrl,
		ziplineToken,
		ziplineImageMaxViews: maxViews,
		ziplineImageExpires: expires,
		ziplineImageCompression: imageCompression,
		ziplineFileNameFormat: fileNameFormat,
		ziplinePassword: password,
		ziplineOverrideDomain: overrideDomain,
		ziplineZeroWidthSpaces: zeroWidthSpaces,
		ziplineNoJSON: noJSON,
		ziplineEmbed: embed,
		ziplineOriginalName: originalName,
	} = await chrome.storage.local.get([
		'ziplineUrl',
		'ziplineToken',
		'ziplineImageMaxViews',
		'ziplineImageExpires',
		'ziplineImageCompression',
		'ziplineFileNameFormat',
		'ziplinePassword',
		'ziplineOverrideDomain',
		'ziplineZeroWidthSpaces',
		'ziplineNoJSON',
		'ziplineEmbed',
		'ziplineOriginalName'
	]);

	if (overrideDomain) overrideDomain = overrideDomain.split('/')[2]

	if (!ziplineUrl || ziplineUrl === "UNSET")
		return chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(ziplineUrl))
		return chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!ziplineToken || ziplineToken === "UNSET")
		return chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	const headers = {
		Authorization: ziplineToken,
		Format: fileNameFormat.toLowerCase(),
		Embed: embed,
		"Image-Compression-Percent": imageCompression,
		"No-JSON": noJSON,
		"Original-Name": originalName,
		"Override-Domain": overrideDomain,
		Zws: zeroWidthSpaces,
		Password: password,
		'Max-Views': maxViews,
	}

	if (expires !== "never") {
		const legend = {
			'5m': 5 * 60 * 1000,
			'10m': 10 * 60 * 1000,
			'15m': 15 * 60 * 1000,
			'30m': 30 * 60 * 1000,
			'1h': 1 * 60 * 60 * 1000,
			'2h': 2 * 60 * 60 * 1000,
			'3h': 3 * 60 * 60 * 1000,
			'4h': 4 * 60 * 60 * 1000,
			'5h': 5 * 60 * 60 * 1000,
			'6h': 6 * 60 * 60 * 1000,
			'8h': 8 * 60 * 60 * 1000,
			'12h': 12 * 60 * 60 * 1000,
			'1d': 1 * 24 * 60 * 60 * 1000,
			'3d': 3 * 24 * 60 * 60 * 1000,
			'5d': 5 * 24 * 60 * 60 * 1000,
			'7d': 7 * 24 * 60 * 60 * 1000,
			'1w': 1 * 7 * 24 * 60 * 60 * 1000,
			'1.5w': 1.5 * 7 * 24 * 60 * 60 * 1000,
			'2w': 2 * 7 * 24 * 60 * 60 * 1000,
			'3w': 3 * 7 * 24 * 60 * 60 * 1000,
			'1M': 1 * 30.44 * 24 * 60 * 60 * 1000, // 30.44 is the average days in 1 month
			'2M': 2 * 30.44 * 24 * 60 * 60 * 1000,
			'3M': 3 * 30.44 * 24 * 60 * 60 * 1000,
			'6M': 6 * 30.44 * 24 * 60 * 60 * 1000,
			'8M': 8 * 30.44 * 24 * 60 * 60 * 1000,
			'1y': 365 * 24 * 60 * 60 * 1000
		}

		console.log(expires, legend[expires], Date.now() + legend[expires])

		const expiresDate = new Date(Date.now() + legend[expires]).toISOString()

		headers['Expires-At'] = `date=${expiresDate}`
	}
	
	try {
		const res = await fetch(`${ziplineUrl}/api/upload`, {
			body: formData,
			method: "POST",
			headers,
		});

		if (!res.ok) {
			const error = await res.json();

			return chrome.notifications.create({
				title: "Error",
				message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		}

		const data = await res.text();

		if (data) {
			chrome.notifications.create({
				title: "Success",
				message: `The file has been upload as ${data}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			return data;
		}

		return chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	} catch (e) {
		console.log(e);
		return chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	}
}

function convertLink(url) {
	const urlObj = new URL(url);
	return `${urlObj.protocol}//${urlObj.host}/*`;
}

async function shortenWithZipline(url) {
	const { ziplineUrl, ziplineToken } = await chrome.storage.local.get([
		"ziplineUrl",
		"ziplineToken",
	]);

	if (!ziplineUrl || ziplineUrl === "UNSET")
		return chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(ziplineUrl))
		return chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!ziplineToken || ziplineToken === "UNSET")
		return chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	try {
		const res = await fetch(`${ziplineUrl}/api/shorten`, {
			body: JSON.stringify({
				url: url,
				vanity: null,
			}),
			method: "POST",
			headers: {
				Authorization: ziplineToken,
				"Content-Type": "application/json",
			},
		});

		if (!res.ok) {
			const error = await res.json();
			
			return chrome.notifications.create({
				title: "Error",
				message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		}

		const data = await res.json();

		if (data) {
			chrome.notifications.create({
				title: "Success",
				message: `The link has been shortened as ${data.url}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			return data.url;
		}

		return chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	} catch (e) {
		console.log(e);

		return chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	}
}

async function convertToFormData(data) {
	if (urlRegex.test(data)) {
		const blob = await downloadFile(data);

		const formData = new FormData();
		formData.append("file", blob);

		return formData;
	}

	const base64Data = data.split(",")[1];
	const string = atob(base64Data);
	const length = string.length;
	const bytes = new Uint8Array(length);

	for (let i = 0; i < length; i++) {
		bytes[i] = string.charCodeAt(i);
	}

	const blob = new Blob([bytes], { type: "image/png" });

	const formData = new FormData();
	formData.append("file", blob);

	return formData;
}