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

let {
	hostname,
	apiVersion,
	token,
	folder: currentFolder,
	maxViews: globalMaxViews,
	expiration: globalExpires,
	fileCompression: globalFileCompression,
	fileNameFormat: globalFileNameFormat,
	password: globalPassword,
	folder: globalFolder,
	overrideDomain: globalOverrideDomain,
	zeroWidthSpaces: globalZeroWidthSpaces,
	embed: globalEmbed,
	originalName: globalOriginalName,
} = await chrome.storage.local.get([
	"hostname",
	"apiVersion",
	"token",
	"folder",
	"maxViews",
	"expiration",
	"fileCompression",
	"fileNameFormat",
	"password",
	"folder",
	"overrideDomain",
	"zeroWidthSpaces",
	"embed",
	"originalName",
]);

if (!apiVersion) apiVersion = "v3";

updateVersionOptions(apiVersion);

const uploadPopup = document.getElementById("uploadPopup");
const copyPopup = document.getElementById("copyPopup");

const textOnlyContainer = document.getElementById("textOnly");
const contentElement = document.getElementById("content");

const maxViewsElement = document.getElementById("ziplineImageMaxViews");
const expiresElement = document.getElementById("ziplineImageExpires");
const imageCompressionElement = document.getElementById(
	"ziplineImageCompression",
);
const fileNameFormatElement = document.getElementById("ziplineFileNameFormat");
const passwordElement = document.getElementById("ziplinePassword");
const filenameElement = document.getElementById("ziplineFilename");
const folderElement = document.getElementById("ziplineFolder");
const overrideDomainElement = document.getElementById("ziplineOverrideDomain");
const zeroWidthSpacesElement = document.getElementById(
	"ziplineZeroWidthSpaces",
);
const embedElement = document.getElementById("ziplineEmbed");
const originalNameElement = document.getElementById("ziplineOriginalName");

if (globalMaxViews) maxViewsElement.value = globalMaxViews;
if (globalExpires) expiresElement.value = globalExpires;
if (globalFileCompression)
	imageCompressionElement.value = globalFileCompression;
if (globalFileNameFormat) fileNameFormatElement.value = globalFileNameFormat;
if (globalPassword) passwordElement.value = globalPassword;
if (globalFolder) folderElement.value = globalFolder;
if (globalOverrideDomain) overrideDomainElement.value = globalOverrideDomain;
if (globalZeroWidthSpaces)
	zeroWidthSpacesElement.checked = globalZeroWidthSpaces;
if (globalEmbed) embedElement.checked = globalEmbed;
if (globalOriginalName) originalNameElement.checked = globalOriginalName;

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
		maxUploadSize,
		chunkSize,
		allowChunkedUploads,
		generalNotifications: showNotifications,
	} = await chrome.storage.local.get([
		"maxUploadSize",
		"chunkSize",
		"allowChunkedUploads",
		"generalNotifications",
	]);

	const maxViews =
		maxViewsElement.value.length > 0 ? maxViewsElement.value : null;
	let expires = expiresElement.value.length > 0 ? expiresElement.value : null;
	const imageCompression =
		imageCompressionElement.value.length > 0
			? imageCompressionElement.value
			: null;
	const fileNameFormat =
		fileNameFormatElement.value.length > 0 ? fileNameFormatElement.value : null;
	const password =
		passwordElement.value.length > 0 ? passwordElement.value : null;
	const customFilename =
		filenameElement.value.length > 0 ? filenameElement.value : null;
	const folder = folderElement.value.length > 0 ? folderElement.value : null;
	const overrideDomain =
		overrideDomainElement.value.length > 0 ? overrideDomainElement.value : null;
	const zeroWidthSpaces = zeroWidthSpacesElement.checked;
	const embed = embedElement.checked;
	const originalName = originalNameElement.checked;

	if (!hostname) {
		await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline URL first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (!urlRegex.test(hostname)) {
		await chrome.notifications.create({
			title: "Error",
			message: "Your Zipline URL is not a valid URL.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (!token) {
		await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	const headers = {};

	const expirationLegend = {
		never: null,
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
		"1.5M": new Date(
			Date.now() + 1.5 * 30.44 * 24 * 60 * 60 * 1000,
		).toISOString(),
		"2M": new Date(Date.now() + 2 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"3M": new Date(Date.now() + 3 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"6M": new Date(Date.now() + 6 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"8M": new Date(Date.now() + 8 * 30.44 * 24 * 60 * 60 * 1000).toISOString(),
		"1y": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
	};

	expires = expirationLegend[expires];

	if (apiVersion === "v3") {
		headers.Authorization = token;
		headers.Format = fileNameFormat.toLowerCase();
		headers["Image-Compression-Percent"] = String(imageCompression);

		if (maxViews) headers["Max-Views"] = String(maxViews);
		if (password) headers.Password = password;
		if (overrideDomain)
			headers["Override-Domain"] = overrideDomain.split("/")[2];
		if (zeroWidthSpaces) headers.Zws = "true";
		if (embed) headers.Embed = "true";
		if (expires) headers["Expires-At"] = `date=${expires}`;
		if (originalName) headers["Original-Name"] = "true";
	} else if (apiVersion === "v4") {
		headers.Authorization = token;
		headers["X-Zipline-Format"] = fileNameFormat.toLowerCase();
		headers["X-Zipline-Image-Compression-Percent"] = String(imageCompression);

		if (maxViews) headers["X-Zipline-Max-Views"] = String(maxViews);
		if (password) headers["X-Zipline-Password"] = password;
		if (folder && folder !== "noFolder") headers["X-Zipline-Folder"] = folder;
		if (overrideDomain)
			headers["X-Zipline-Domain"] = overrideDomain.split("/")[2];
		if (expires) headers["X-Zipline-Deletes-At"] = `date=${expires}`;
		if (originalName) headers["X-Zipline-Original-Name"] = "true";
		if (customFilename) headers["X-Zipline-Filename"] = customFilename;
	}

	if (blob.size > maxUploadSize * 1024 * 1024) {
		await chrome.notifications.create({
			title: "Error",
			message: "This file is too big, it exceeds the max upload size you set.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return window.close();
	}

	if (blob.size > 95 * 1024 * 1024 && !allowChunkedUploads) {
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

	if (showNotifications)
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
			const res = await fetch(`${hostname}/api/upload`, {
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

			if (apiVersion === "v3") {
				const url = data?.files?.[0];

				if (url) return url;
			} else if (apiVersion === "v4") {
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

			if (apiVersion === "v3") {
				headers["X-Zipline-Partial-Filename"] = filename;
				headers["X-Zipline-Partial-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-Partial-Identifier"] = identifier;
				headers["X-Zipline-Partial-Mimetype"] = blob.type;
			} else if (apiVersion === "v4") {
				headers["X-Zipline-P-Filename"] = filename;
				headers["X-Zipline-P-Lastchunk"] = i === 0 ? "true" : "false";
				headers["X-Zipline-P-Identifier"] = identifier;
				headers["X-Zipline-P-Mimetype"] = blob.type;
			}

			try {
				const response = await fetch(`${hostname}/api/upload`, {
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

				if (apiVersion === "v3" && data.files) return data.files;
				if (apiVersion === "v4" && data.files?.length > 0)
					return data.files?.[0]?.url;

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

	const { generalNotifications: showNotifications } =
		await chrome.storage.local.get(["ziplineGeneralNotifications"]);

	if (urlRegex.test(data)) {
		console.log("Fetching file...");

		if (showNotifications)
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

	if (showNotifications)
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
			const res = await fetch(`${hostname}/api/user/folders?noincl=true`, {
				headers: {
					Authorization: token,
				},
			});

			const folders = await res.json();

			const currentFolderExists = folders.find(
				(folder) => folder.id === currentFolder,
			);

			let selectedFolder = false;

			if (!currentFolderExists) {
				await chrome.storage.local.set({
					folder: "noFolder",
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
