await chrome.action.setPopup({
	popup: "popups/settings/settings.html",
});

const translationElements = document.querySelectorAll("[data-translation]");

for (const translationElement of translationElements) {
	const translationId = translationElement.dataset.translation;

	const translation = chrome.i18n.getMessage(translationId);

	if (translation) translationElement.innerText = translation;
}

let { hostname, apiVersion, maxViews, password } =
	await chrome.storage.local.get([
		"hostname",
		"apiVersion",
		"maxViews",
		"password",
	]);

if (!apiVersion) apiVersion = "v3";

updateVersionOptions(apiVersion);

const { shortenUrl } = await chrome.storage.local.get(["shortenUrl"]);

const shortenPopup = document.getElementById("shortenPopup");
const copyPopup = document.getElementById("copyPopup");

const urlElement = document.getElementById("url");
const vanityElement = document.getElementById("vanity");
const maxViewsElement = document.getElementById("maxViews");
const passwordElement = document.getElementById("password");

const outputUrlElement = document.getElementById("outputUrl");

urlElement.value = shortenUrl;
if (maxViews) maxViewsElement.value = maxViews;
if (password) passwordElement.value = password;

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

document.getElementById("shorten").onclick = async () => {
	if (!urlElement.value || !urlRegex.test(urlElement.value))
		return await chrome.notifications.create({
			title: "Error",
			message: `Invalid URL "${urlElement.value || "none"}".`,
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	const url = await shortenWithZipline({
		url: urlElement.value,
		vanity: vanityElement.value || null,
		password: passwordElement.value || null,
		maxViews: maxViewsElement.value || null,
	});

	if (!urlRegex.test(url)) {
		await chrome.storage.local.remove(["shortenUrl"]);

		await window.close();
	}

	outputUrlElement.value = url;
	shortenPopup.style.display = "none";
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

async function shortenWithZipline({
	url,
	vanity,
	password: urlPassword,
	maxViews: urlMaxViews,
}) {
	const { ziplineToken } = await chrome.storage.local.get(["ziplineToken"]);

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

	if (!ziplineToken)
		return await chrome.notifications.create({
			title: "Error",
			message: "Please set your Zipline token first.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	try {
		let endpoint;
		const body = {};
		const extraHeaders = {};

		if (apiVersion === "v3") {
			endpoint = "/api/shorten";

			body.url = url;
			if (vanity) body.vanity = vanity;
		} else if (apiVersion === "v4") {
			endpoint = "/api/user/urls";

			body.destination = url;
			if (vanity) body.vanity = vanity;

			if (urlMaxViews)
				extraHeaders["X-Zipline-Max-Views"] = String(urlMaxViews);
			if (urlPassword) extraHeaders["X-Zipline-Password"] = urlPassword;
		}

		const res = await fetch(`${hostname}${endpoint}`, {
			body: JSON.stringify(body),
			method: "POST",
			headers: {
				Authorization: ziplineToken,
				"Content-Type": "application/json",
				...extraHeaders,
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
		await chrome.notifications.create({
			title: "Error",
			message: JSON.stringify(data),
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

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
		await chrome.notifications.create({
			title: "Error",
			message: e.toString(),
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

		return await chrome.notifications.create({
			title: "Error",
			message:
				"Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.",
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});
	}
}

async function updateVersionOptions(version) {
	const versionElements = document.querySelectorAll("[data-zipline-version]");

	for (const versionElement of versionElements) {
		if (versionElement.dataset.ziplineVersion === version)
			versionElement.style.display = "block";
		else versionElement.style.display = "none";
	}
}
