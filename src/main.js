chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install") {
		await chrome.storage.local.set({
			hostname: null,
			token: null,
			apiVersion: "v3",
			maxViews: null,
			expiration: "never",
			fileCompression: 0,
			fileNameFormat: "random",
			password: null,
			folder: null,
			overrideDomain: null,
			maxUploadSize: 100,
			chunkSize: 50,
			zeroWidthSpaces: false,
			embed: true,
			originalName: false,
			allowChunkedUploads: false,
			chunkedUploadsNotifications: false,
			generalNotifications: true,
			enableExperimentalFeatures: false,
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

	if (!experimentalFeatures) return;

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
		hostname,
		token,
		apiVersion,
		maxViews,
		expiration,
		fileCompression,
		fileNameFormat,
		password,
		folder,
		overrideDomain,
		maxUploadSize,
		chunkSize,
		zeroWidthSpaces,
		embed,
		originalName,
		allowChunkedUploads,
		generalNotifications: showNotifications
	} = await chrome.storage.local.get([
		"hostname",
		"token",
		"apiVersion",
		"maxViews",
		"expiration",
		"fileCompression",
		"fileNameFormat",
		"password",
		"folder",
		"overrideDomain",
		"maxUploadSize",
		"chunkSize",
		"zeroWidthSpaces",
		"embed",
		"originalName",
		"allowChunkedUploads",
		"generalNotifications"
	]);

	if (!apiVersion) apiVersion = "v3";

	if (!hostname)
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(hostname))
		return await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!token)
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	const headers = {};

	const expirationLegend = {
		"never": null,
		"5m": new Date(Date.now() + 5 * 60 * 1000).toISOString(),
		"10m": new Date(Date.now() + 10 * 60 * 1000).toISOString(),
		"15m": new Date(Date.now() + 15 * 60 * 1000).toISOString(),
		"30m": new Date(Date.now() + 30 * 60 * 1000).toISOString(),
		"1h": new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
		"2h": new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
		"3h": new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
		"4h": new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
		"5h": new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
		"6h": new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
		"8h": new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
		"12h": new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
		"1d": new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
		"3d": new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
		"5d": new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
		"7d": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		"1w": new Date(Date.now() + 1 * 7 * 24 * 60 * 60 * 1000).toISOString(),
		"1.5w": new Date(Date.now() + 1.5 * 7 * 24 * 60 * 60 * 1000).toISOString(),
		"2w": new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000).toISOString(),
		"3w": new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toISOString(),
		"1M": new Date(Date.now() + 1 * 30.44 * 24 * 60 * 60 * 1000).toISOString(), // 30.44 is the average days in 1 month
		"1.5M": new Date(Date.now() + 1.5 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"2M": new Date(Date.now() + 2 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"3M": new Date(Date.now() + 3 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"6M": new Date(Date.now() + 6 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"8M": new Date(Date.now() + 8 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"1y": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
	}

	expiration = expirationLegend[expiration]

	if (apiVersion === "v3") {
		headers.Authorization = token
		headers.Format = fileNameFormat.toLowerCase()
		headers["Image-Compression-Percent"] = String(fileCompression)

		if (maxViews) headers["Max-Views"] = String(maxViews)
		if (password) headers.Password = password
		if (overrideDomain) headers["Override-Domain"] = overrideDomain.split("/")[2]
		if (zeroWidthSpaces) headers.Zws = "true"
		if (embed) headers.Embed = "true"
		if (expiration) headers["Expiration-At"] = `date=${expiration}`
		if (originalName) headers["Original-Name"] = "true"
	} else if (apiVersion === "v4") {
		headers.Authorization = token
		headers["X-Zipline-Format"] = fileNameFormat.toLowerCase()
		headers["X-Zipline-Image-Compression-Percent"] = String(fileCompression)

		if (maxViews) headers["X-Zipline-Max-Views"] = String(maxViews)
		if (password) headers["X-Zipline-Password"] = password
		if (folder && folder !== "noFolder") headers["X-Zipline-Folder"] = folder
		if (overrideDomain) headers["X-Zipline-Domain"] = overrideDomain.split("/")[2]
		if (expiration) headers["X-Zipline-Deletes-At"] = `date=${expiration}`
		if (originalName) headers["X-Zipline-Original-Name"] = "true"
	}

	if (blob.size > maxUploadSize * 1024 * 1024)
		return await chrome.notifications.create({
			title: "Error",
			message: "This file is too big, it exceeds the max upload size you set.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (blob.size > 95 * 1024 * 1024 && allowChunkedUploads)
		return await chrome.notifications.create({
			title: "Error",
			message:
				"This file is too big, you must allow chunked uploads to upload this file.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	console.log("Uploading file...");

	if (showNotifications) await chrome.notifications.create({
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
			const res = await fetch(`${hostname}/api/upload`, {
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

			if (apiVersion === "v3") {
				const url = data?.files?.[0]

				if (url) return url;
			} else if (apiVersion === "v4") {
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

			const { chunkedUploadsNotifications: showChunkedUploadNotification } =
				await chrome.storage.local.get(["chunkedUploadsNotifications"]);

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

			if (apiVersion === "v3") {
				headers["X-Zipline-Partial-Filename"] = filename;
				headers["X-Zipline-Partial-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-Partial-Identifier"] = identifier;
				headers["X-Zipline-Partial-Mimetype"] = blob.type;
			} else if (apiVersion === "v4") {
				headers["X-Zipline-P-Filename"] = filename;
				headers["X-Zipline-P-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-P-Identifier"] = identifier;
				headers["X-Zipline-P-Content-Type"] = blob.type;
				headers["X-Zipline-P-Content-Length"] = blob.size
			}

			try {
				const response = await fetch(`${hostname}/api/upload`, {
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

				if (apiVersion === "v3" && data.files) return data.files;
				if (apiVersion === "v4" && data.files?.length > 0) return data.files?.[0]?.url;

				console.log(`Successfully uploaded the chunk ${chunkId}`);

				if (showChunkedUploadNotification)
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
	let { hostname, token, apiVersion } = await chrome.storage.local.get([
		"hostname",
		"token",
		"apiVersion"
	]);

	if (!apiVersion) apiVersion = "v3";

	if (!hostname)
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!urlRegex.test(hostname))
		return await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	if (!token)
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	try {
		let endpoint;
		let body = {}

		if (apiVersion === "v3") {
			endpoint = "/api/shorten";

			body = {
				url: url,
			};
		}
		else if (apiVersion === "v4") {
			endpoint = "/api/user/urls"

			body = {
				destination: url,
			}
		}

		const res = await fetch(`${hostname}${endpoint}`, {
			body: JSON.stringify(body),
			method: "POST",
			headers: {
				Authorization: token,
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

	const { generalNotifications: showNotifications } = await chrome.storage.local.get(['ziplineGeneralNotifications'])

	if (urlRegex.test(data)) {
		console.log("Fetching file...");

		if (showNotifications) chrome.notifications.create({
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

	if (showNotifications) chrome.notifications.create({
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
