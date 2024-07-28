await chrome.action.setPopup({
	popup: 'popups/settings/settings.html'
})

const { shortenUrl } = await chrome.storage.local.get(['shortenUrl'])

const settings = [
    'url',
    'vanity'
]

const urlElement = document.getElementById('url')
const vanityElement = document.getElementById('vanity')

urlElement.value = shortenUrl

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;

document.getElementById('shorten').onclick = async () => {
	if (!urlElement.value ||!urlRegex.test(urlElement.value)) return chrome.notifications.create({
		title: "Success",
		message: `Invalid URL "${urlElement.value || 'none'}".`,
		type: "basic",
		iconUrl: chrome.runtime.getURL("icons/512.png"),
	});

    await shortenWithZipline(urlElement.value, vanityElement.value || null)

	await chrome.storage.local.remove(['shortenUrl'])

	await window.close()
}

async function shortenWithZipline(url, vanity) {
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
