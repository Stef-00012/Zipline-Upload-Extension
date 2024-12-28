chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install") {
		await chrome.storage.local.set({
			ziplineUrl: "UNSET",
			ziplineToken: "UNSET",
			ziplineVersion: "v3",
			ziplineImageMaxViews: "",
			ziplineImageExpires: "never",
			ziplineImageCompression: "0",
			ziplineFileNameFormat: "random",
			ziplinePassword: "",
			ziplineFolder: "UNSET",
			ziplineOverrideDomain: "",
			ziplineMaxUploadSize: "100",
			ziplineChunkSize: "50",
			ziplineZeroWidthSpaces: "false",
			ziplineEmbed: "true",
			ziplineOriginalName: "false",
			ziplineAllowChunkedUploads: "false",
			ziplineChunkedUploadsNotifications: "false",
			ziplineGeneralNotifications: "true",
			ziplineEnableExperimentalFeatures: "false",
		});
	}
});

chrome.runtime.onInstalled.addListener(async () => {
	chrome.contextMenus.create({
		id: "Zipline_Upload_File",
		title: chrome.i18n.getMessage("contextMenu_UploadFile") || "Upload File to Zipline",
		contexts: ["image", "video", "audio"],
	});

	chrome.contextMenus.create({
		id: "Advanced_Zipline_Upload_File",
		title: chrome.i18n.getMessage("contextMenu_UploadFileAdvanced") || "Upload File to Zipline (Advanced Options)",
		contexts: ["image", "video", "audio"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Upload_Text",
		title: chrome.i18n.getMessage("contextMenu_UploadText") || "Upload Text to Zipline",
		contexts: ["selection"],
	});

	chrome.contextMenus.create({
		id: "Advanced_Zipline_Upload_Text",
		title: chrome.i18n.getMessage("contextMenu_UploadTextAdvanced") || "Upload Text to Zipline (Advanced Options)",
		contexts: ["selection"],
	});

	chrome.contextMenus.create({
		id: "Zipline_Shorten_URL",
		title: chrome.i18n.getMessage("contextMenu_ShortenUrl") || "Shorten URL with Zipline",
		contexts: ["link"],
	});

	chrome.contextMenus.create({
		id: "Advanced_Zipline_Shorten_URL",
		title: chrome.i18n.getMessage("contextMenu_ShortenUrlAdvanced") || "Shorten URL with Zipline (Advanced Options)",
		contexts: ["link"],
	});

	const { ziplineEnableExperimentalFeatures: experimentalFeatures } =
		await chrome.storage.local.get(["ziplineEnableExperimentalFeatures"]);

	if (experimentalFeatures !== "true") return;

	chrome.contextMenus.create({
		id: "Zipline_Upload_URL",
		title: chrome.i18n.getMessage("contextMenu_UploadUrl") || "Upload URL with Zipline [Experimental]",
		contexts: ["link"],
	});

	chrome.contextMenus.create({
		id: "Advanced_Zipline_Upload_URL",
		title: chrome.i18n.getMessage("contextMenu_UploadUrlAdvanced") || "Upload URL with Zipline (Advanced Options) [Experimental]",
		contexts: ["link"],
	});
});

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

chrome.contextMenus.onClicked.addListener(async (info) => {
	switch (info.menuItemId) {
		case "Zipline_Upload_File": {
			const blob = await convertToBlob(info.srcUrl);

			if (!blob)
				return await chrome.notifications.create({
					title: "Error",
					message: "Unable to fetch the image, unknown protocol.",
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});

			const url = await uploadToZipline(blob);

			if (!urlRegex.test(url)) return;

			await chrome.storage.local.set({
				outputUrl: url
			})

			await chrome.action.setPopup({
				popup: 'popups/outputUrl/outputUrl.html'
			})

			await chrome.action.openPopup()

			break;
		}

		case "Advanced_Zipline_Upload_File": {
			await chrome.storage.local.set({
				uploadData: JSON.stringify({
					data: info.srcUrl,
					type: "file",
				}),
			});

			await chrome.action.setPopup({
				popup: "popups/upload/upload.html",
			});

			await chrome.action.openPopup();

			break;
		}

		case "Zipline_Upload_Text": {
			const blob = new Blob([info.selectionText], {
				type: "text/plain",
			});

			const url = await uploadToZipline(blob, true);

			if (!urlRegex.test(url)) return;

			await chrome.storage.local.set({
				outputUrl: url
			})

			await chrome.action.setPopup({
				popup: 'popups/outputUrl/outputUrl.html'
			})

			await chrome.action.openPopup()

			break;
		}

		case "Advanced_Zipline_Upload_Text": {
			await chrome.storage.local.set({
				uploadData: JSON.stringify({
					data: info.selectionText,
					type: "text",
				}),
			});

			await chrome.action.setPopup({
				popup: "popups/upload/upload.html",
			});

			await chrome.action.openPopup();

			break;
		}

		case "Zipline_Shorten_URL": {
			const url = await shortenWithZipline(info.linkUrl);

			if (!urlRegex.test(url)) return;

			await chrome.storage.local.set({
				outputUrl: url
			})

			await chrome.action.setPopup({
				popup: 'popups/outputUrl/outputUrl.html'
			})

			await chrome.action.openPopup()

			break;
		}

		case "Advanced_Zipline_Shorten_URL": {
			await chrome.storage.local.set({
				shortenUrl: info.srcUrl,
			});

			await chrome.action.setPopup({
				popup: "popups/shorten/shorten.html",
			});

			await chrome.action.openPopup();

			break;
		}

		case "Zipline_Upload_URL": {
			try {
				const blob = await convertToBlob(info.linkUrl);

				if (!blob)
					return await chrome.notifications.create({
						title: "Error",
						message: "Unable to fetch the URL, unknown protocol.",
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});

				const url = await uploadToZipline(blob);

				if (!urlRegex.test(url)) return;

				await chrome.storage.local.set({
					outputUrl: url
				})

				await chrome.action.setPopup({
					popup: 'popups/outputUrl/outputUrl.html'
				})

				await chrome.action.openPopup()

				break;
			} catch (e) {
				console.log(e);
				return await chrome.notifications.create({
					title: "Error",
					message:
						"Something went wrong [Experimental Feature]...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});
			}
		}

		case "Advanced_Zipline_Upload_URL": {
			await chrome.storage.local.set({
				uploadData: JSON.stringify({
					data: info.linkUrl,
					type: "url",
				}),
			});

			await chrome.action.setPopup({
				popup: "popups/upload/upload.html",
			});

			await chrome.action.openPopup();

			break;
		}
	}
});

async function uploadToZipline(blob, text = false) {
	let {
		ziplineUrl,
		ziplineToken,
		ziplineVersion,
		ziplineImageMaxViews: maxViews,
		ziplineImageExpires: expires,
		ziplineImageCompression: imageCompression,
		ziplineFileNameFormat: fileNameFormat,
		ziplinePassword: password,
		ziplineFolder: folder,
		ziplineOverrideDomain: overrideDomain,
		ziplineMaxUploadSize: maxUploadSize,
		ziplineChunkSize: chunkSize,
		ziplineZeroWidthSpaces: zeroWidthSpaces,
		ziplineEmbed: embed,
		ziplineOriginalName: originalName,
		ziplineAllowChunkedUploads: allowChunkedUploads,
		ziplineGeneralNotifications: showNotifications
	} = await chrome.storage.local.get([
		"ziplineUrl",
		"ziplineToken",
		"ziplineVersion",
		"ziplineImageMaxViews",
		"ziplineImageExpires",
		"ziplineImageCompression",
		"ziplineFileNameFormat",
		"ziplinePassword",
		"ziplineFolder",
		"ziplineOverrideDomain",
		"ziplineMaxUploadSize",
		"ziplineChunkSize",
		"ziplineZeroWidthSpaces",
		"ziplineEmbed",
		"ziplineOriginalName",
		"ziplineAllowChunkedUploads",
		"ziplineGeneralNotifications"
	]);

	if (!ziplineVersion) ziplineVersion = "v3";
	if (overrideDomain) overrideDomain = overrideDomain.split("/")[2];

	if (!ziplineUrl || ziplineUrl === "UNSET")
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(ziplineUrl))
		return await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!ziplineToken || ziplineToken === "UNSET")
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	let headers = {};

	if (ziplineVersion === "v3") {
		headers = {
			Authorization: ziplineToken,
			Format: fileNameFormat.toLowerCase(),
			Embed: embed,
			"Image-Compression-Percent": imageCompression,
			"Original-Name": originalName,
			"Override-Domain": overrideDomain,
			Zws: zeroWidthSpaces,
			Password: password,
			"Max-Views": maxViews,
		}
	} else if (ziplineVersion === "v4") {
		headers = {
			Authorization: ziplineToken,
			"X-Zipline-Domain": overrideDomain,
			"X-Zipline-Format": fileNameFormat.toLowerCase(),
			"X-Zipline-Image-Compression-Percent": imageCompression,
			"X-Zipline-Max-Views": maxViews,
			"X-Zipline-Original-Name": originalName,
			"X-Zipline-Password": password,
		}
	}

	if (expires !== "never") {
		if (ziplineVersion === "v3") {
			const legend = {
				"5m": 5 * 60 * 1000,
				"10m": 10 * 60 * 1000,
				"15m": 15 * 60 * 1000,
				"30m": 30 * 60 * 1000,
				"1h": 1 * 60 * 60 * 1000,
				"2h": 2 * 60 * 60 * 1000,
				"3h": 3 * 60 * 60 * 1000,
				"4h": 4 * 60 * 60 * 1000,
				"5h": 5 * 60 * 60 * 1000,
				"6h": 6 * 60 * 60 * 1000,
				"8h": 8 * 60 * 60 * 1000,
				"12h": 12 * 60 * 60 * 1000,
				"1d": 1 * 24 * 60 * 60 * 1000,
				"3d": 3 * 24 * 60 * 60 * 1000,
				"5d": 5 * 24 * 60 * 60 * 1000,
				"7d": 7 * 24 * 60 * 60 * 1000,
				"1w": 1 * 7 * 24 * 60 * 60 * 1000,
				"1.5w": 1.5 * 7 * 24 * 60 * 60 * 1000,
				"2w": 2 * 7 * 24 * 60 * 60 * 1000,
				"3w": 3 * 7 * 24 * 60 * 60 * 1000,
				"1M": 1 * 30.44 * 24 * 60 * 60 * 1000, // 30.44 is the average days in 1 month
				"1.5M": 1.5 * 30.44 * 24 * 60 * 60 * 1000,
				"2M": 2 * 30.44 * 24 * 60 * 60 * 1000,
				"3M": 3 * 30.44 * 24 * 60 * 60 * 1000,
				"6M": 6 * 30.44 * 24 * 60 * 60 * 1000,
				"8M": 8 * 30.44 * 24 * 60 * 60 * 1000,
				"1y": 365 * 24 * 60 * 60 * 1000,
			};
	
			const expiresDate = new Date(Date.now() + legend[expires]).toISOString();
	
			if (ziplineVersion === "v3") headers["Expires-At"] = `date=${expiresDate}`;
			else if (ziplineVersion === "v4") headers["X-Zipline-Deletes-At"] = `date=${expiresDate}`;
		}
		else if (ziplineVersion === "v4") {
			const v4Legend = {
				"5m": "5min",
				"10m": "10min",
				"15m": "15min",
				"30m": "30min",
				"1h": "1h",
				"2h": "2h",
				"3h": "3h",
				"4h": "4h",
				"5h": "5h",
				"6h": "6h",
				"8h": "8h",
				"12h": "12h",
				"1d": "1d",
				"3d": "3d",
				"5d": "5d",
				"7d": "7d",
				"1w": "1w",
				"1.5w": "1.5w",
				"2w": "2w",
				"3w": "3w",
				"1M": "30d",
				"1.5M": "45.625d",
				"2M": "60d",
				"3M": "90d",
				"6M": "120d",
				"8M": "180d",
				"1y": "1y",
			};

			headers["X-Zipline-Deletes-At"] = v4Legend[expires];
		}
	}

	if (ziplineVersion === "v4" && ["UNSET", "noFolder"].every(value => folder !== value)) headers["X-Zipline-Folder"] = folder;

	if (blob.size > maxUploadSize * 1024 * 1024)
		return await chrome.notifications.create({
			title: "Error",
			message: "This file is too big, it exceeds the max upload size you set.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (blob.size > 95 * 1024 * 1024 && allowChunkedUploads === "false")
		return await chrome.notifications.create({
			title: "Error",
			message:
				"This file is too big, you must allow chunked uploads to upload this file.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	console.log("Uploading file...");

	if (showNotifications === "true") await chrome.notifications.create({
		title: "Upload",
		message: "Uploading the file...",
		type: "basic",
		iconUrl: chrome.runtime.getURL("icons/512.png"),
	});

	if (blob.size < 95 * 1024 * 1024) {
		const filename = `${new Date().toISOString()}.${(await guessMimetype(blob.type)) || "png"}`;

		console.log(
			`Starting normal upload\nFile Size: ${Math.floor(blob.size / 1024 / 1024)}mb\nFile Mimetype: ${blob.type}\nUploaded File Name: ${filename}`,
		);

		const formData = new FormData();

		if (text) formData.append("file", blob, `${new Date().toISOString()}.txt`);
		else formData.append("file", blob, filename);

		try {
			const res = await fetch(`${ziplineUrl}/api/upload`, {
				body: formData,
				method: "POST",
				headers,
			});

			if (!res.ok) {
				const error = await res.json();

				return await chrome.notifications.create({
					title: "Error",
					message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});
			}

			const data = await res.json();
			console.debug(data)

			if (ziplineVersion === "v3") {
				const url = data?.files?.[0]

				if (url) return url;
			} else if (ziplineVersion === "v4") {
				const url = data?.files?.[0]?.url

				if (url) return url;
			}

			return await chrome.notifications.create({
				title: "Error",
				message:
					"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		} catch (e) {
			console.log(e);
			return await chrome.notifications.create({
				title: "Error",
				message:
					"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		}
	} else {
		const numberOfChunks = Math.ceil(blob.size / (chunkSize * 1024 * 1024));

		const identifier = generateRandomString();
		const filename = `${new Date().toISOString()}.${(await guessMimetype(blob.type)) || "png"}`;

		console.log(
			`Starting chunked upload\nFile Size: ${Math.floor(blob.size / 1024 / 1024)}mb\nFile Mimetype: ${blob.type}\nNumber of Chunks: ${numberOfChunks}\nChunk Size: ${chunkSize}mb\nIdentifier: ${identifier}\nUploaded File Name: ${filename}`,
		);

		for (let i = numberOfChunks - 1; i >= 0; i--) {
			const chunkId = numberOfChunks - i;

			console.log(`Starting upload chunk ${chunkId}`);

			const { ziplineChunkedUploadsNotifications: showChunkedUploadNotification } =
				await chrome.storage.local.get(["ziplineChunkedUploadsNotifications"]);

			const start = i * (chunkSize * 1024 * 1024);
			const end = Math.min(start + chunkSize * 1024 * 1024, blob.size);

			const chunk = blob.slice(start, end);
			const formData = new FormData();

			formData.append("file", chunk, {
				filename,
				contentType: blob.type,
				knownLength: end - start,
			});

			headers["Content-Range"] = `bytes ${start}-${end - 1}/${blob.size}`;

			if (ziplineVersion === "v3") {
				headers["X-Zipline-Partial-Filename"] = filename;
				headers["X-Zipline-Partial-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-Partial-Identifier"] = identifier;
				headers["X-Zipline-Partial-Mimetype"] = blob.type;
			} else if (ziplineVersion === "v4") {
				headers["X-Zipline-P-Filename"] = filename;
				headers["X-Zipline-P-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-P-Identifier"] = identifier;
				headers["X-Zipline-P-Content-Type"] = blob.type;
				headers["X-Zipline-P-Content-Length"] = blob.size
			}

			try {
				const response = await fetch(`${ziplineUrl}/api/upload`, {
					method: "POST",
					body: formData,
					headers,
				});

				if (!response.ok) {
					const error = await response.json();

					return await chrome.notifications.create({
						title: "Error",
						message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});
				}

				const data = await response.json();
				console.debug(data)

				if (ziplineVersion === "v3" && data.files) return data.files;
				if (ziplineVersion === "v4" && data.files?.length > 0) return data.files?.[0]?.url;

				console.log(`Successfully uploaded the chunk ${chunkId}`);

				if (showChunkedUploadNotification === "true")
					await chrome.notifications.create({
						title: "Chunked Upload",
						message: `Successfully upload the chunk ${chunkId} out of ${numberOfChunks}\nStarted uploading the chunk ${chunkId + 1}`,
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});
			} catch (e) {
				console.log(e);
				return await chrome.notifications.create({
					title: "Error",
					message:
						"Something went wrong [Chunked Upload]...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});
			}
		}
	}
}

async function shortenWithZipline(url) {
	const { ziplineUrl, ziplineToken, ziplineVersion } = await chrome.storage.local.get([
		"ziplineUrl",
		"ziplineToken",
		"ziplineVersion"
	]);

	if (!ziplineUrl || ziplineUrl === "UNSET")
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(ziplineUrl))
		return await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!ziplineToken || ziplineToken === "UNSET")
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	try {
		let endpoint;
		let body = {}

		if (ziplineVersion === "v3") {
			endpoint = "/api/shorten";

			body = {
				url: url,
			};
		}
		else if (ziplineVersion === "v4") {
			endpoint = "/api/user/urls"

			body = {
				destination: url,
			}
		}

		const res = await fetch(`${ziplineUrl}${endpoint}`, {
			body: JSON.stringify(body),
			method: "POST",
			headers: {
				Authorization: ziplineToken,
				"Content-Type": "application/json",
			},
		});

		if (!res.ok) {
			const error = await res.json();

			return await chrome.notifications.create({
				title: "Error",
				message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		}

		const data = await res.json();

		if (data) return data.url;

		return await chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	} catch (e) {
		console.log(e);

		return await chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	}
}

async function downloadFile(url) {
	const response = await fetch(url);
	const blob = await response.blob();

	return blob;
}

async function convertToBlob(data) {
	if (
		!data.startsWith("http://") &&
		!data.startsWith("https://") &&
		!data.startsWith("data:")
	)
		return null;

	const { ziplineGeneralNotifications: showNotifications } = await chrome.storage.local.get(['ziplineGeneralNotifications'])

	if (urlRegex.test(data)) {
		console.log("Fetching file...");

		if (showNotifications === "true") chrome.notifications.create({
			title: "Upload",
			message:
				"Fetching the file...",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		const blob = await downloadFile(data);

		return blob;
	}

	console.log("Decoding base64 file...");

	if (showNotifications === "true") chrome.notifications.create({
		title: "Upload",
		message:
			"Decoding the file...",
		type: "basic",
		iconUrl: chrome.runtime.getURL("icons/512.png"),
	});

	const base64Data = data.split(",")[1];
	const mimetype = data.split(":")[1].split(";")[0];
	const string = atob(base64Data);
	const length = string.length;
	const bytes = new Uint8Array(length);

	for (let i = 0; i < length; i++) {
		bytes[i] = string.charCodeAt(i);
	}

	const blob = new Blob([bytes], { type: mimetype || "image/png" });

	return blob;
}

function generateRandomString() {
	return Math.random().toString(36).substring(2, 6);
}

async function guessMimetype(mimetype) {
	if (!mimetype) return "xmp";

	const mimetypesRes = await fetch(
		chrome.runtime.getURL("public/mimetypes.json"),
	);
	const mimetypes = await mimetypesRes.json();

	const mime = mimetypes[mimetype];
	if (!mime) return "xmp";

	return mime;
}
