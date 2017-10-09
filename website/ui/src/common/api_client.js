export const StaticServer = "http://screen-beta.wenglab.org"; //"http://megatux.purcaro.com:9006";
export const StaticUrl = (fn) => (StaticServer + fn)

const Servers = (b) => {
    const server = "http://screen-beta.wenglab.org";
    let override = {"/gbws/geneTrack" : "http://localhost:9006/gbws/geneTrack",
		      "/gbws/trackhub" : "http://localhost:9006/gbws/trackhub"};
    override = {};
    if(b in override){
	return override[b];
    }
    return server + b;
};

export const getByPost  = (jq, url, successF, errF) => {
    fetch(Servers(url),
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	      method: "POST",
	      body: jq
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

export const autocompleteBox = (jq, successF, errF) => {
    getByPost(jq, "/autows/search", successF, errF);
}

export const appPageBaseInit = (jq, url, successF, errF) => {
    getByPost(jq, url, successF, errF);
}

export const globals = (assembly, successF, errF) => {
    fetch(Servers("/globalData/0/") + assembly)
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}
