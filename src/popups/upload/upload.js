await chrome.action.setPopup({
	popup: "popups/settings/settings.html",
});

const translationElements = document.querySelectorAll("[data-translation]");

for (const translationElement of translationElements) {
	const translationId = translationElement.dataset.translation;

	const translation = chrome.i18n.getMessage(translationId);

	if (translation) translationElement.innerText = translation;
}

let { uploadData } = await chrome.storage.local.get(["uploadData"]);

if (!uploadData) window.close();

try {
	uploadData = JSON.parse(uploadData);
} catch (e) {
	window.close();
}

if (["url", "file", "text"].every((type) => uploadData.type !== type))
	window.close();

let { ziplineUrl, ziplineVersion, ziplineToken, ziplineFolder: currentFolder } = await chrome.storage.local.get([
	"ziplineUrl",
	"ziplineVersion",
	"ziplineToken",
	"ziplineFolder"
]);

if (!ziplineVersion) ziplineVersion = "v3";

updateVersionOptions(ziplineVersion);

const uploadPopup = document.getElementById("uploadPopup");
const copyPopup = document.getElementById("copyPopup");

const textOnlyContainer = document.getElementById("textOnly");
const contentElement = document.getElementById("content");
const vanityElement = document.getElementById("vanity");

const outputUrlElement = document.getElementById("outputUrl");

if (uploadData.type === "text") {
	textOnlyContainer.style.display = "block";
	contentElement.value = uploadData.data;
}

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

document.getElementById("upload").onclick = async () => {
	let url;

	if (uploadData.type === "text") {
		if (!contentElement.value)
			return await chrome.notifications.create({
				title: "Error",
				message: `Invalid Text "${contentElement.value || "none"}".`,
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

		const blob = new Blob([contentElement.value], {
			type: "text/plain",
		});

		url = await uploadToZipline(blob, true);
	} else if (uploadData.type === "file") {
		const blob = await convertToBlob(uploadData.data);

		if (!blob)
			return await chrome.notifications.create({
				title: "Error",
				message: "Unable to fetch the image, unknown protocol.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

		url = await uploadToZipline(blob);
	} else if (uploadData.type === "url") {
		const blob = await convertToBlob(uploadData.data);

		if (!blob)
			return await chrome.notifications.create({
				title: "Error",
				message: "Unable to fetch the URL, unknown protocol.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

		url = await uploadToZipline(blob);
	}

	if (!url || !urlRegex.test(url)) {
		await chrome.storage.local.remove(["uploadData"]);

		await window.close();
	}

	outputUrlElement.value = url;
	uploadPopup.style.display = "none";
	copyPopup.style.display = "block";
	document.getElementById("html").style.height = "200px";
};

document.getElementById("copy").onclick = async () => {
	if (!outputUrlElement.value || !urlRegex.test(outputUrlElement.value))
		return await chrome.notifications.create({
			title: "Error",
			message: `Invalid URL "${outputUrlElement.value || "none"}".`,
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	navigator.clipboard.writeText(outputUrlElement.value);

	await window.close();
};

async function uploadToZipline(blob, text = false) {
	const {
		ziplineMaxUploadSize: maxUploadSize,
		ziplineChunkSize: chunkSize,
		ziplineAllowChunkedUploads: allowChunkedUploads,
		ziplineGeneralNotifications: showNotifications,
		ziplineImageMaxViews: globalMaxViews,
		ziplineImageExpires: globalExpires,
		ziplineImageCompression: globalImageCompression,
		ziplineFileNameFormat: globalFileNameFormat,
		ziplinePassword: globalPassword,
		ziplineFolder: globalFolder,
		ziplineOverrideDomain: globalOverrideDomain,
		ziplineZeroWidthSpaces: globalZeroWidthSpaces,
		ziplineEmbed: globalEmbed,
		ziplineOriginalName: globalOriginalName
	} = await chrome.storage.local.get([
		"ziplineMaxUploadSize",
		"ziplineChunkSize",
		"ziplineAllowChunkedUploads",
		"ziplineGeneralNotifications",
		"ziplineImageMaxViews",
		"ziplineImageExpires",
		"ziplineImageCompression",
		"ziplineFileNameFormat",
		"ziplinePassword",
		"ziplineFolder",
		"ziplineOverrideDomain",
		"ziplineZeroWidthSpaces",
		"ziplineEmbed",
		"ziplineOriginalName"
	]);

	const maxViews = document.getElementById("ziplineImageMaxViews").value || globalMaxViews;
	const expires = document.getElementById("ziplineImageExpires").value || globalExpires;
	const imageCompression = document.getElementById(
		"ziplineImageCompression",
).value || globalImageCompression;
	const fileNameFormat = document.getElementById("ziplineFileNameFormat").value || globalFileNameFormat;
	const password = document.getElementById("ziplinePassword").value || globalPassword;
	const customFilename = document.getElementById("ziplineFilename").value;
	const folder = document.getElementById("ziplineFolder").value || globalFolder;
	let overrideDomain = document.getElementById("ziplineOverrideDomain").value || globalOverrideDomain;
	const zeroWidthSpaces = document.getElementById(
		"ziplineZeroWidthSpaces",
	).checked || globalZeroWidthSpaces;
	const embed = document.getElementById("ziplineEmbed").checked || globalEmbed;
	const originalName = document.getElementById("ziplineOriginalName").checked || globalOriginalName;

	if (overrideDomain) overrideDomain = overrideDomain.split("/")[2];

	if (!ziplineUrl || ziplineUrl === "UNSET") {
		await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (!urlRegex.test(ziplineUrl)) {
		await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (!ziplineToken || ziplineToken === "UNSET") {
		await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

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
		};
	} else if (ziplineVersion === "v4") {
		headers = {
			Authorization: ziplineToken,
			"X-Zipline-Domain": overrideDomain,
			"X-Zipline-Format": fileNameFormat.toLowerCase(),
			"X-Zipline-Image-Compression-Percent": imageCompression,
			"X-Zipline-Max-Views": maxViews,
			"X-Zipline-Original-Name": originalName,
			"X-Zipline-Password": password,
		};

		if (customFilename) headers["X-Zipline-Filename"] = customFilename;
	}

	if (expires !== "never") {
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

	if (
		ziplineVersion === "v4" &&
		["UNSET", "noFolder"].every((value) => folder !== value)
	)
		headers["X-Zipline-Folder"] = folder;

	if (blob.size > maxUploadSize * 1024 * 1024) {
		await chrome.notifications.create({
			title: "Error",
			message: "This file is too big, it exceeds the max upload size you set.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (blob.size > 95 * 1024 * 1024 && allowChunkedUploads === "false") {
		await chrome.notifications.create({
			title: "Error",
			message:
				"This file is too big, you must allow chunked uploads to upload this file.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	console.log("Uploading file...");

	if (showNotifications === "true")
		await chrome.notifications.create({
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

				await chrome.notifications.create({
					title: "Error",
					message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});

				return window.close();
			}

			const data = await res.json();
			console.debug(data);

			if (ziplineVersion === "v3") {
				const url = data?.files?.[0];

				if (url) return url;
			} else if (ziplineVersion === "v4") {
				const url = data?.files?.[0]?.url;

				if (url) return url;
			}

			await chrome.notifications.create({
				title: "Error",
				message:
					"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			return window.close();
		} catch (e) {
			console.log(e);
			await chrome.notifications.create({
				title: "Error",
				message:
					"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

			return window.close();
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

			const {
				ziplineChunkedUploadsNotifications: showChunkedUploadNotification,
			} = await chrome.storage.local.get([
				"ziplineChunkedUploadsNotifications",
			]);

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
				headers["X-Zipline-P-Mimetype"] = blob.type;
			}

			try {
				const response = await fetch(`${ziplineUrl}/api/upload`, {
					method: "POST",
					body: formData,
					headers,
				});

				if (!response.ok) {
					const error = await response.json();

					await chrome.notifications.create({
						title: "Error",
						message: `Something went wrong...\nError ${error.code}: ${error.error}.`,
						type: "basic",
						iconUrl: chrome.runtime.getURL("icons/512.png"),
					});

					return window.close();
				}

				const data = await response.json();
				console.debug(data);

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
				await chrome.notifications.create({
					title: "Error",
					message:
						"Something went wrong [Chunked Upload]...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
					type: "basic",
					iconUrl: chrome.runtime.getURL("icons/512.png"),
				});

				return window.close();
			}
		}
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

	const { ziplineGeneralNotifications: showNotifications } =
		await chrome.storage.local.get(["ziplineGeneralNotifications"]);

	if (urlRegex.test(data)) {
		console.log("Fetching file...");

		if (showNotifications === "true")
			chrome.notifications.create({
				title: "Upload",
				message: "Fetching the file...",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});

		const blob = await downloadFile(data);

		return blob;
	}

	console.log("Decoding base64 file...");

	if (showNotifications === "true")
		chrome.notifications.create({
			title: "Upload",
			message: "Decoding the file...",
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

async function updateVersionOptions(version) {
	const versionElements = document.querySelectorAll("[data-zipline-version]");

	for (const versionElement of versionElements) {
		if (versionElement.dataset.ziplineVersion === version)
			versionElement.style.display = "block";
		else versionElement.style.display = "none";
	}

	if (version === "v4") {
		const folderSelectElement = document.getElementById("ziplineFolder");

		const noFolderOption = document.createElement("option");

		noFolderOption.value = "noFolder";
		noFolderOption.innerText = "No Folder";

		try {
			const res = await fetch(`${ziplineUrl}/api/user/folders?noincl=true`, {
				headers: {
					Authorization: ziplineToken,
				},
			});

			const folders = await res.json();

			const currentFolderExists = folders.find(
				(folder) => folder.id === currentFolder,
			);

			let selectedFolder = false;

			if (!currentFolderExists) {
				await chrome.storage.local.set({
					ziplineFolder: "noFolder",
				});
			}

			for (const folder of folders) {
				const folderName = folder.name;
				const folderId = folder.id;

				const option = document.createElement("option");

				option.value = folderId;
				option.innerText = folderName;

				if (folder.id === currentFolder) {
					option.selected = true;
					selectedFolder = true;
				}

				folderSelectElement.appendChild(option);
			}

			if (!selectedFolder) noFolderOption.selected = true;

			folderSelectElement.appendChild(noFolderOption);
		} catch (e) {
			noFolderOption.selected = true;

			folderSelectElement.appendChild(noFolderOption);
		}
	}
}
