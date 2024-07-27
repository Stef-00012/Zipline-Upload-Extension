chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install") {
		await chrome.storage.local.set({
			ziplineUrl: "UNSET",
			ziplineToken: "UNSET",
			ziplineFileNameFormat: "random",
			ziplineImageCompression: "0",
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
});

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

chrome.contextMenus.onClicked.addListener(async (info) => {
	switch (info.menuItemId) {
		case "Zipline_Upload_Image": {
			if (urlRegex.test(info.srcUrl)) {
				chrome.permissions.request(
					{ origins: [convertLink(info.srcUrl)] },
					async (granted) => {
						if (granted) {
							const blob = await downloadFile(info.srcUrl);

							const formData = new FormData();
							formData.append("file", blob);

							return await uploadToZipline(formData);
						}

						return chrome.notifications.create({
							title: "Error",
							message: "Image upload cancelled, permission to website denied.",
							type: "basic",
							iconUrl: chrome.runtime.getURL("icons/512.png"),
						});
					},
				);

				return;
			}

			const base64Data = info.srcUrl.split(",")[1];
			const string = atob(base64Data);
			const length = string.length;
			const bytes = new Uint8Array(length);

			for (let i = 0; i < length; i++) {
				bytes[i] = string.charCodeAt(i);
			}

			const blob = new Blob([bytes], { type: "image/png" });

			const formData = new FormData();
			formData.append("file", blob);

			await uploadToZipline(formData);

			break;
		}

		case "Zipline_Upload_Video": {
			chrome.permissions.request(
				{ origins: [convertLink(info.srcUrl)] },
				async (granted) => {
					if (granted) {
						const blob = await downloadFile(info.srcUrl);

						const formData = new FormData();
						formData.append("file", blob);

						return await uploadToZipline(formData);
					}

					return chrome.notifications.create({
						title: "Error",
						message: "Video upload cancelled, permission to website denied.",
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});
				},
			);

			break;
		}

		case "Zipline_Upload_Audio": {
			chrome.permissions.request(
				{ origins: [convertLink(info.srcUrl)] },
				async (granted) => {
					if (granted) {
						const blob = await downloadFile(info.srcUrl);

						const formData = new FormData();
						formData.append("file", blob);

						return await uploadToZipline(formData);
					}

					return chrome.notifications.create({
						title: "Error",
						message: "Audio upload cancelled, permission to website denied.",
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});
				},
			);

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
	}
});

async function downloadFile(url) {
	const mimeTypesUrl = chrome.runtime.getURL("./public/mimetypes.json");

	const res = await fetch(mimeTypesUrl);
	const data = await res.json();

	const response = await fetch(url);
	const blob = await response.blob();

	const extension = data[blob.type] || "text/plain";

	return blob;
}

async function uploadToZipline(formData) {
	const {
		ziplineUrl,
		ziplineToken,
		ziplineFileNameFormat: fileNameFormat,
		ziplineImageCompression: imageCompression,
		ziplineOverrideDomain: overrideDomain,
		ziplineZeroWidthSpaces: zeroWidthSpaces,
		ziplineNoJSON: noJSON,
		ziplineEmbed: embed,
		ziplineOriginalName: originalName,
	} = await chrome.storage.local.get([
		"ziplineUrl",
		"ziplineToken",
		"ziplineFileNameFormat",
		"ziplineImageCompression",
		"ziplineOverrideDomain",
		"ziplineZeroWidthSpaces",
		"ziplineNoJSON",
		"ziplineEmbed",
		"ziplineOriginalName",
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
		const res = await fetch(`${ziplineUrl}/api/upload`, {
			body: formData,
			method: "POST",
			headers: {
				Authorization: ziplineToken,
				Format: fileNameFormat.toLowerCase(),
				Embed: embed,
				"Image-Compression-Percent": imageCompression,
				"No-JSON": noJSON,
				"Original-Name": originalName,
				"Override-Domain": overrideDomain,
				Zws: zeroWidthSpaces,
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

		const data = await res.text();

		if (data) {
			return chrome.notifications.create({
				title: "Success",
				message: `The file has been upload as ${data}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
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
			return chrome.notifications.create({
				title: "Success",
				message: `The link has been shortened as ${data.url}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
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
