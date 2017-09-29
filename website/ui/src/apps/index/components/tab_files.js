import React from 'react';

import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';
import {tabPanelize} from '../../../common/utility';

const fileDownload = (url, fn) => {
    return (
	<span>
	    <a href={url} download={fn}>
		<span className="glyphicon glyphicon-download" aria-hidden="true" />
	    </a>
	</span>);
}

const CtaTableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    const dl = (a) => {
	return fileDownload(a.join('/'), a[1]);
    }
    
    return [
	{
	    title: "Assembly", data: "assembly", className: klassCenter,
	}, {
            title: "5 group", data: "fiveGroup", className: klassCenter,
	    render: dl
	}, {
            title: "5 group url", data: "fiveGroup", visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "h3k27ac", className: klassCenter,
	    render: dl
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "h3k27ac", visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "h3k4me3", className: klassCenter,
	    render: dl
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "h3k4me3", visible: false
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "ctcf", className: klassCenter,
	    render: dl
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "ctcf", visible: false
	}
    ];
}

const CtsTableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    const dccLink = (expID) => {
	if("NA" === expID){
	    return "-";
	}
	let fn = expID + ".bigBed.bed.gz";
	let url = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/" +
		  fn;
	return fileDownload(url, fn);
    }

    const fiveGroupDownload = (a) => {
	return fileDownload(a[0], a[1]);
    }
    
    return [
	{
	    title: "Assembly", data: "assembly", className: klassCenter,
	}, {
	    title: "Tissue", data: "tissue", className: klassCenter,
	}, {
	    title: "Biosample", data: "celltypedesc", className: klassCenter,
	}, {
            title: "5 group", data: "fiveGroup", className: klassCenter,
	    render: fiveGroupDownload
	}, {
            title: "5 group url", data: "fiveGroup", visible: false
	}, {
            title: <span>9 state high&nbsp;DNase</span>, data: "dnase", className: klassCenter,
	    render: dccLink
	}, {
            title: <span>9 state high&nbsp;DNase</span>, data: "dnase_url", visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "h3k27ac", className: klassCenter,
	    render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "h3k27ac_url", visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "h3k4me3", className: klassCenter,
	    render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "h3k4me3_url", visible: false
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "ctcf", className: klassCenter,
	    render: dccLink
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "ctcf_url", visible: false
	}
    ];
}

class TabFiles extends React.Component {
    constructor(props) {
	super(props);
        this.key = "files"
	this.state = { isFetching: false, isError: false };
    }

    componentDidMount(){
        if(this.key === this.props.maintabs_active){
	    this.loadFiles(this.props);
	}
    }

    componentWillReceiveProps(nextProps){
        if(this.key === nextProps.maintabs_active){
	    this.loadFiles(nextProps);
	}
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    loadFiles(nextProps){
        if("files" in this.state){
            return;
        }
	if(this.state.isFetching){
	    return;
	}
	this.setState({isFetching: true});
        fetch("/globalData/index/index")
	    .then((response) => (response.json()))
	    .then((r) => {
		this.setState({files: r, isFetching: false, isError: false});
	    })
	    .catch((err) => {
		console.log("err loading files");
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }

    doRenderWrapper(){
        if("files" in this.state){
	    const base = "http://bib7.umassmed.edu/~purcarom/encyclopedia/Version-4/ver10";
	    const WWW = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10";
	    const cta = [
		{assembly: "mm10",
		 ctcf: [WWW, "mm10-cRE.CTCF.cREs.bigBed"],
		 fiveGroup: [base + "/mm10", "mm10-cREs-V10.bigBed"],
		 h3k4me3: [WWW, "mm10-cRE.Promoter.cREs.bigBed"],
		 h3k27ac: [WWW, "mm10-cRE.Enhancer.cREs.bigBed"]},
		{assembly: "hg19",
		 ctcf: [WWW, "hg19-cRE.CTCF.cREs.bigBed"],
		 fiveGroup: [base + "/hg19", "hg19-cREs-V10.bigBed"],
		 h3k4me3: [WWW, "hg19-cRE.Promoter.cREs.bigBed"],
		 h3k27ac: [WWW, "hg19-cRE.Enhancer.cREs.bigBed"]}
	    ];
	    return (
		<div>
		    <h3>Cell type-agnostic</h3>
		    <Ztable data={cta}
				  cols={CtaTableColumns()}
				  bFilter={true}
				  bLengthChange={true}
		    />
		    <h3>Cell type-specific</h3>
		    <Ztable data={this.state.files}
				  cols={CtsTableColumns()}
				  bFilter={true}
				  bLengthChange={true}
                    />
		</div>);
        }
	return loading({...this.state})
    }

    
    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>
                {this.doRenderWrapper()}
	    </div>));
    }
}

export default TabFiles;
