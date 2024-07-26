const settings = [
    'ziplineUrl',
    'ziplineToken',
    'ziplineFileNameFormat',
    'ziplineImageCompression',
    'ziplineOverrideDomain',
    'ziplineZeroWidthSpaces',
    'ziplineNoJSON',
    'ziplineEmbed',
    'ziplineOriginalName'
]

for (const setting of settings) {
    const element = document.getElementById(setting)

    const { [element.id]: elementData } = await chrome.storage.local.get([element.id])

    if (['text', 'number'].includes(element.type) || element.tagName === 'SELECT') {
        element.value = elementData === 'UNSET' ? '' : elementData
    } else {
        element.checked = elementData === 'yes'
    }

    element.oninput = async (event) => {
        if (['text', 'number'].includes(element.type) || element.tagName === 'SELECT') {
            await chrome.storage.local.set({
                [element.id]: element.value
            })
        } else {
            await chrome.storage.local.set({
                [element.id]: element.checked ? 'yes' : 'no'
            })
        }
    }
}