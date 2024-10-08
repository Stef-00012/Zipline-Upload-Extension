await chrome.action.setPopup({
	popup: "popups/settings/settings.html",
});

const translationElements = document.querySelectorAll('[data-translation]')

for (const translationElement of translationElements) {
	const translationId = translationElement.dataset.translation

	const translation = chrome.i18n.getMessage(translationId)

	if (translation) translationElement.innerText = translation
}

const { shortenUrl } = await chrome.storage.local.get(["shortenUrl"]);

const shortenPopup = document.getElementById('shortenPopup')
const copyPopup = document.getElementById('copyPopup')

const urlElement = document.getElementById("url");
const vanityElement = document.getElementById("vanity");

const outputUrlElement = document.getElementById('outputUrl')

urlElement.value = shortenUrl;

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

document.getElementById("shorten").onclick = async () => {
	if (!urlElement.value || !urlRegex.test(urlElement.value))
		return await chrome.notifications.create({
			title: "Error",
			message: `Invalid URL "${urlElement.value || "none"}".`,
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	const url = await shortenWithZipline(urlElement.value, vanityElement.value || null);

	if (!urlRegex.test(url)) {
		await chrome.storage.local.remove(["shortenUrl"]);

		await window.close();
	}

	outputUrlElement.value = url
	shortenPopup.style.display = 'none'
	copyPopup.style.display = 'block'
	document.getElementById('html').style.height = '200px'
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

async function shortenWithZipline(url, vanity) {
	const { ziplineUrl, ziplineToken } = await chrome.storage.local.get([
		"ziplineUrl",
		"ziplineToken",
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
		const res = await fetch(`${ziplineUrl}/api/shorten`, {
			body: JSON.stringify({
				url: url,
				vanity: vanity || null,
			}),
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
