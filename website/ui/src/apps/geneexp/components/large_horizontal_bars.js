import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';
import {panelize} from '../../../common/utility';
import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import LongChecklist from '../../../common/components/longchecklist'

class CellCompartmentsBox extends React.Component {
    render(){
	const compartments = this.props.globals.cellCompartments;
	const compartments_selected = this.props.compartments_selected;
	return panelize("Cellular Compartments",
			<LongChecklist
			    title={""}
			    data={compartments.map((e) => {
				    return {key: e, selected: compartments_selected.has(e)}})}
			    cols={[{
				    title: "", data: "key",
				    className: "nopadding"
			    }]}
			    order={[]}
			    buttonsOff={true}
			    noSearchBox={true}
			    checkBoxClassName={"nopadding"}
			    noTotal={true}
			    mode={CHECKLIST_MATCH_ANY}
			    onTdClick={(c) => {
				    this.props.actions.toggleCompartment(c) } }
			/>);
    }
}

class BiosampleTypesBox extends React.Component {
    render(){
	const biosample_types = this.props.globals.geBiosampleTypes;
	const biosample_types_selected = this.props.biosample_types_selected;
	return panelize("Biosample Types",
			<LongChecklist
                            title={""}
                            data={biosample_types.map((e) => {
                                    return {key: e,
                                            selected: biosample_types_selected.has(e)
                                    }})}
                            cols={[{
		                    title: "", data: "key",
		                    className: "nopadding"
	                    }]}
                            order={[]}
			    noSearchBox={true}
			    checkBoxClassName={"nopadding"}
			    noTotal={true}
			    buttonsOff={true}
        	            mode={CHECKLIST_MATCH_ANY}
                            onTdClick={(c) => { 
				    this.props.actions.toggleBiosampleType(c) 
			    } }
			/>);
    }
}

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.controlBar = this.controlBar.bind(this);
	this.state = {
	    sortorder: "byTissue",
	    datascale: "logTPM"
	};
    }

    sortSelect(){
        return panelize("Sort order",
			<select ref="sortorder" defaultValue={this.state.sortorder}
				onChange={() => {
					this.setState({sortorder:
					this.refs.sortorder.value})}}>
			    <option value="byExpressionTPM">
				by expression &#40;TPM&#41;</option>
			    <option value="byExpressionFPKM">
				by expression &#40;FPKM&#41;</option>
			    <option value="byTissue">
				by tissue</option>
			    <option value="byTissueMaxTPM">
				by tissue max &#40;TPM&#41;</option>
			    <option value="byTissueMaxFPKM">
				by tissue max &#40;FPKM&#41;</option>
			</select>);
    }
    
    dataScale(){
        return panelize("Data",
			<select ref="datascale" defaultValue={"logTPM"}
			    onChange={() => {
				    this.setState({datascale:
				    this.refs.datascale.value})}}>
			    <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
			    <option value="rawTPM">TPM</option>
			    <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
			    <option value="rawFPKM">FPKM</option>
			</select>);
    }
    
    doRender({isFetching, hasData, width}){
        if(isFetching){
            return loading(this.props);
        }
	if (!hasData){
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}

	let format = {
	    value: d => d[this.state.datascale],
	    label: d => {
		if(d.ageTitle){
		    return d.cellType + ' ' + d.ageTitle;
		}
		return d.cellType},
	    grouplabel: d => d.displayName
	};

        return (
            <div>
                <span className="geTissueOfOrigin">Tissue of origin</span>
		<ScaledHorizontalBar itemsets={this.props.items[this.state.sortorder]}
				     width={width}
				     barheight={this.props.barheight}
				     format={format} />
	    </div>
        );
    }
    
    controlBar(){
	if(!this.props.useBoxes){
	    return (
	        <div className="row">
                    {this.sortSelect()}
                    {this.dataScale()}
	        </div>);
	}
	return(
	    <div className="row">
		<div className="col-md-3">
		    {this.sortSelect()}
		    {this.dataScale()}
		</div>
		<div className="col-md-3">
	 	    <BiosampleTypesBox globals={this.props.globals}
				       actions={this.props.actions}
				       biosample_types_selected={this.props.biosample_types_selected}
		    />
		</div>
		<div className="col-md-3">
		    <CellCompartmentsBox globals={this.props.globals}
		    			 actions={this.props.actions}
					 compartments_selected={this.props.compartments_selected} />
		</div>
	    </div>
	);
    }

    render() {
	return (
            <div>
		{this.controlBar()}
                {this.doRender(this.props)}
            </div>);
    }

}

export default LargeHorizontalBars;
