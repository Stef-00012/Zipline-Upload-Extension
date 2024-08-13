await chrome.action.setPopup({
	popup: "popups/settings/settings.html",
});

const translationElements = document.querySelectorAll('[data-translation]')

for (const translationElement of translationElements) {
	const translationId = translationElement.dataset.translation

	const translation = chrome.i18n.getMessage(translationId)

	if (translation) translationElement.innerText = translation
}

const { outputUrl } = await chrome.storage.local.get(["outputUrl"]);

const urlElement = document.getElementById("url");

urlElement.value = outputUrl;

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

document.getElementById("copy").onclick = async () => {
	if (!urlElement.value || !urlRegex.test(urlElement.value))
		return await chrome.notifications.create({
			title: "Success",
			message: `Invalid URL "${urlElement.value || "none"}".`,
			type: "basic",
			iconUrl: chrome.runtime.getURL("icons/512.png"),
		});

	navigator.clipboard.writeText(urlElement.value);

	await chrome.storage.local.remove(["outputUrl"]);

	await window.close();
};
