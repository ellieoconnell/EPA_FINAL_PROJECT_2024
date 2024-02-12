export function ApiPath() {
    const apiDomain = 'api.ocoelean.people.aws.dev'
    const domainCDN = window.location.host.toLowerCase()

    console.log(domainCDN)

    const hasPrefix = domainCDN.includes("alpha")

    if (hasPrefix) {
        const prefix = window.location.host.toLowerCase().split('.')[0]
        const usePrefix = prefix.substring(0, prefix.length - 4)
        console.log('this is the prefix created: ' + usePrefix)
        return usePrefix + apiDomain
    } else {
        console.log('No prefix detected.')
        return apiDomain
    }
}

export function createApiPath() {
    const apiUrl = 'https://' + ApiPath()
    console.log('this is the url created: ' + apiUrl)
    return apiUrl
}