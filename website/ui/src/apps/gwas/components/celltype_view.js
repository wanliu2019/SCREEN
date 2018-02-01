import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';
import * as ApiClient from '../../../common/api_client';

import loading from '../../../common/components/loading';
import Ztable from '../../../common/components/ztable/ztable';
import HelpIcon from '../../../common/components/help_icon';

class AllCTView extends React.Component {

    constructor(props) {
        super(props);
	this.button_click_handler = this.button_click_handler.bind(this);
    }

    button_click_handler(name, rowdata, actions){
	const cre = {...rowdata, ...rowdata.info, len: rowdata.stop - rowdata.start};
	if(name.indexOf("browser") !== -1){
	    actions.showGenomeBrowser(cre, name);
	} else {
            actions.showReDetail(cre);
	}
    }
    
    render() {
        let data = this.props.data;
        let cres = data.accessions;
        let vcols = data.vcols;

        let cols = [
            {title: "cRE", data: "info", 
             render: Render.creTableAccession(this.props.globals),
	     sortDataF: (info) => (info.accession)
	    },
	    {title: "H3K4me3 Z", data: "promoter zscore", render: Render.real,
	     visible: vcols["promoter zscore"]},
            {title: "H3K27ac Z", data: "enhancer zscore", render: Render.real,
             visible: vcols["enhancer zscore"]},
            {title: "DNase Z", data: "dnase zscore",
             visible: vcols["dnase zscore"]},
            {title: "SNPs", data: "snps", 
	     render: Render.snpLinks(this.props.assembly)},
            {title: "gene", data: "geneid", 
	     render: Render.geneLink},
	    {
		title: "genome browsers", data: null,
		className: "browser",
		targets: -1,
		orderable: false,
		defaultContent: Render.browser_buttons(["UCSC"])
		//, "Ensembl"
	     }
        ];

	const columnDefs = [{ "orderData": 2, "targets": 1 }];
	const actions = this.props.actions;
	
        const creTable = (
	    <Ztable
		key="_all"
		onTdClick={(td, rowdata) =>
		    this.button_click_handler(td, rowdata, actions)}
		data={cres}
		columnDefs={columnDefs}
		cols={cols}
		bFilter={true}
		cvisible={vcols}
		order={[[2, "desc"], [0, "asc"]]}
            />);
	const numCresOverlap = this.props.rdata.numCresOverlap;
	return (
            <div>
                <h3 style={{display: "inline"}}>
                    <HelpIcon globals={this.props.globals}
			      helpkey={"GWAS_Results_Table"} />
                </h3>{" "}
		<em>No cell type-specific information is available for this study. All {numCresOverlap} overlapping cREs are shown.
		</em>
		<br />
		<br />
                {creTable}
	    </div>);
    }
    
}
const amapStateToProps = (state) => ({ ...state });
const amapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
let ConnAllCTView = connect(amapStateToProps, amapDispatchToProps)(AllCTView);
export {ConnAllCTView};

class CelltypeView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: true, isError: false};
        this.loadCres = this.loadCres.bind(this);
	this.button_click_handler = this.button_click_handler.bind(this);
    }

    button_click_handler(name, rowdata, actions){
	const cre = {...rowdata, ...rowdata.info, len: rowdata.stop - rowdata.start};
	if(name.indexOf("browser") !== -1){
	    actions.showGenomeBrowser(cre, name);
	} else {
            actions.showReDetail(cre);
	}
    }
    
    componentDidMount(){
        this.loadCres(this.props);
    }

    componentWillReceiveProps(nextProps){
        //console.log("componentWillReceiveProps", nextProps);
        this.loadCres(nextProps);
    }

    componentWillUnmount(){
        // else next study will reuse celltype
        this.props.actions.setCellType(null);
    }

    loadCres({assembly, gwas_study, cellType, actions}){
        if(cellType.cellTypeName in this.state){
            return;
        }
        const q = {assembly, gwas_study, "cellType" : cellType.cellTypeName };
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
        ApiClient.getByPost(jq, "/gwasws/cres",
			    (r) => {
				this.setState({...r, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading cres for table");
				this.setState({isFetching: false, isError: true});
			    });
    }

    render() {
        if(!(this.props.cellType.cellTypeName in this.state)){
            return loading(this.state);
        }
	let ctn = this.props.cellType.cellTypeName;
	let bss = this.props.cellType.biosample_summary;
        let data = this.state[ctn];
        let cres = data.accessions;
        let vcols = data.vcols;

        let cols = [
            {title: "cRE", data: "info", 
             render: Render.creTableAccession(this.props.globals),
	     sortDataF: (info) => (info.accession)
	    },
	    {title: bss, data: "ctspecifc", 
	     name: "cts", render: Render.creTableCellTypeSpecific(this.props.globals),
	     width: "15%"},
	    {title: "H3K4me3 Z", data: "promoter zscore", render: Render.real,
	     visible: vcols["promoter zscore"]},
            {title: "H3K27ac Z", data: "enhancer zscore", render: Render.real,
             visible: vcols["enhancer zscore"]},
            {title: "DNase Z", data: "dnase zscore",
             visible: vcols["dnase zscore"]},
            {title: "SNPs", data: "snps", 
	     render: Render.snpLinks(this.props.assembly)},
            {title: "gene", data: "geneid", 
	     render: Render.geneLink},
	    {
		title: "genome browsers", data: null,
		className: "browser",
		targets: -1,
		orderable: false,
		defaultContent: Render.browser_buttons(["UCSC"])
		//, "Ensembl"
	     }
        ];

	const columnDefs = [{ "orderData": 2, "targets": 1 }];
	const actions = this.props.actions;
	
        const creTable = (
	    <Ztable
		key={ctn}
		onTdClick={(td, rowdata) =>
		    this.button_click_handler(td, rowdata, actions)}
		data={cres}
		columnDefs={columnDefs}
		cols={cols}
		bFilter={true}
		cvisible={vcols}
		order={[[2, "desc"], [0, "asc"]]}
            />);
	const pct = Math.round(100.0 * cres.length / +this.props.rdata.numCresOverlap);
	const numCresOverlap = this.props.rdata.numCresOverlap;
	return (
            <div>
                <h3 style={{display: "inline"}}>
                    {bss}
                    <HelpIcon globals={this.props.globals}
			      helpkey={"GWAS_Results_Table"} />
                </h3>{" "}
		<em>{cres.length} / {numCresOverlap} cREs ({pct}%) active in this cell type
		</em>
		<br />
		<br />
                {creTable}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CelltypeView);
