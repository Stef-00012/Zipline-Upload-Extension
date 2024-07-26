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

chrome.runtime.onInstalled.addListener((details) => {
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

chrome.contextMenus.onClicked.addListener(async (info) => {
	switch (info.menuItemId) {
		case "Zipline_Upload_Image": {
			console.log(info.srcUrl);
			const base64Data = info.srcUrl.split(",")[1];
			const string = atob(base64Data);
			const length = string.length;
			const bytes = new Uint8Array(length);

			for (let i = 0; i < length; i++) {
				bytes[i] = string.charCodeAt(i);
			}

			const blob = new Blob([bytes], { type: "image/png" });

			const file = new File([blob], "image.png", { type: "image/png" });

			const formData = new FormData();
			formData.append("file", file);

            await uploadToZipline(formData)

			break;
		}

		case "Zipline_Upload_Video": {
            const file = await downloadFile(info.srcUrl)

            const formData = new FormData();
			formData.append("file", file);

            await uploadToZipline(formData)

			break;
		}

		case "Zipline_Upload_Audio": {
            console.log(info.srcUrl)
            const file = await downloadFile(info.srcUrl)
            
            const formData = new FormData();
			formData.append("file", file);

            await uploadToZipline(formData)

			break;
		}

		case "Zipline_Upload_Text": {
			console.log(info.selectionText);
			const blob = new Blob([info.selectionText], {
				type: "text/plain",
			});

			const file = new File([blob], new Date().toISOString(), {
				type: "text/plain",
			});

			const formData = new FormData();
			formData.append("file", file);

            await uploadToZipline(formData)

			break;
		}

		case "Zipline_Shorten_URL": {
			console.log(info.linkUrl);
			break;
		}
	}
});

async function downloadFile(url) {
    const mimeTypesUrl = chrome.runtime.getURL('./public/mimetypes.json');

    const res = await fetch(mimeTypesUrl)
    const data = await res.json()

	const response = await fetch(url);
	const blob = await response.blob();
	const extension = data[blob.type] || 'text/plain';

	const file = new File([blob], `${new Date().toISOString()}.${extension}`, {
		type: blob.type,
	});

	return file;
}

async function uploadToZipline(formdata) {
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

    if (!ziplineUrl || ziplineUrl === "UNSET") return chrome.notifications.create({
        title: 'Error',
        message: 'Please set your Zipline URL first.',
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/512.png')
    })

    if (!/^http:\/\/(.*)?|https:\/\/(.*)?$/.test(ziplineUrl)) return chrome.notifications.create({
        title: 'Error',
        message: 'Your Zipline URL is not a valid URL.',
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/512.png')
    })

    if (!ziplineToken || ziplineToken === "UNSET") return chrome.notifications.create({
        title: 'Error',
        message: 'Please set your Zipline token first.',
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/512.png')
    })

    try {
        const res = await fetch(ziplineUrl, {
            body: formdata,
            method: 'POST',
            headers: {
                Authorization: ziplineToken,
                "content-type": "multitype/formdata",
                Format: fileNameFormat.toLowerCase(),
                Embed: embed,
                "Image-Compression-Percent": imageCompression,
                'No-JSON': noJSON,
                'Original-Name': originalName,
                'Override-Domain': overrideDomain,
                Zws: zeroWidthSpaces
            }
        })

        const data = await res.json()

        console.log(data)
    } catch(e) {
        return chrome.notifications.create({
            title: 'Error',
            message: 'Something went wrong...\nPlease report this issue at https://github.com/Stef-00012/Zipline-Upload-Extension/issues.',
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/512.png')
        })
    }
}