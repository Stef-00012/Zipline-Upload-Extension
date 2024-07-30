const settings = [
    'ziplineUrl',
    'ziplineToken',
    'ziplineImageMaxViews',
    'ziplineImageExpires',
    'ziplineImageCompression',
    'ziplineFileNameFormat',
    'ziplinePassword',
    'ziplineOverrideDomain',
    'ziplineMaxUploadSize',
    'ziplineChunkSize',
    'ziplineZeroWidthSpaces',
    'ziplineNoJSON',
    'ziplineEmbed',
    'ziplineOriginalName',
    'ziplineAllowChunkedUploads',
    'ziplineEnableExperimentalFeatures'
]

for (const setting of settings) {
    const element = document.getElementById(setting)

    const { [element.id]: elementData } = await chrome.storage.local.get([element.id])

    if (['text', 'number', 'password'].includes(element.type) || element.tagName === 'SELECT') {
        element.value = elementData === 'UNSET' ? '' : elementData
    } else {
        element.checked = elementData === 'true'
    }

    element.oninput = async () => {
        if (['text', 'number', 'password'].includes(element.type) || element.tagName === 'SELECT') {
            await chrome.storage.local.set({
                [element.id]: String(element.value)
            })
        } else {
            await chrome.storage.local.set({
                [element.id]: element.checked ? 'true' : 'false'
            })

            try {
                if (element.id === "ziplineEnableExperimentalFeatures" && element.checked) {
                    chrome.contextMenus.create({
                        id: "Zipline_Upload_URL",
                        title: "Upload URL with Zipliine [Experimental]",
                        contexts: ["link"],
                    });
                } else {
                    chrome.contextMenus.remove("Zipline_Upload_URL")
                }
            } catch(e) {
                console.log('unable to toogle experimental context menu options')
            }
        }
    }
}

const grantUploadPermissionButton = document.getElementById('grantUploadPermission')
const ziplineUrlElement = document.getElementById('ziplineUrl')

grantUploadPermissionButton.onclick = () => {
    chrome.permissions.request({ origins: [`${ziplineUrlElement.value}/*`] }, async (granted) => {
		if (!granted) {
            return chrome.notifications.create({
                title: 'Error',
                message: `The extension was not granted the permission to access "${ziplineUrlElement.value}". You won't be able to upload or shorten anything.`,
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/512.png')
            })
        }
	});
}