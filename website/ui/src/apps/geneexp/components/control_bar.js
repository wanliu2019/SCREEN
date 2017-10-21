import React from 'react'
import {ButtonToolbar, ToggleButtonGroup, ToggleButton} from 'react-bootstrap';

import {panelize, CenterView} from '../../../common/utility';
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

class TmpFpkmBox extends React.Component {
    render(){
	let a = "TPM";
	let b = "FPKM";
	return (
	    <ButtonToolbar style={{display: "flex", justifyContent: "center"}}>
		<ToggleButtonGroup type="radio" name="options" 
				   defaultValue={this.props.defaultValue}>
		    <ToggleButton value={true} bsSize="xsmall"
				  onClick={() => {this.props.setVal(true);}}>
			{a}
		    </ToggleButton>
		    <ToggleButton value={false} bsSize="xsmall"
				  onClick={() => {this.props.setVal(false);}}>
			{b}
		    </ToggleButton>
		</ToggleButtonGroup>
	    </ButtonToolbar>);
    }
}

class LinearLogBox extends React.Component {
    render(){
	let a = "Linear";
	let b = "Log2";
	return (
	    <ButtonToolbar style={{display: "flex", justifyContent: "center"}}>
		<ToggleButtonGroup type="radio" name="options"
				   defaultValue={this.props.defaultValue}>
		    <ToggleButton value={true} bsSize="xsmall"
				  onClick={() => {this.props.setVal(true);}}>
			{a}
		    </ToggleButton>
		    <ToggleButton value={false} bsSize="xsmall"
				  onClick={() => {this.props.setVal(false);}}>
			{b}
		    </ToggleButton>
		</ToggleButtonGroup>
	    </ButtonToolbar>);
    }
}

class RepBox extends React.Component {
    render(){
	let a = "Ind.";
	let b = "Avg.";
	return (
	    <ButtonToolbar style={{display: "flex", justifyContent: "center"}}>
		<ToggleButtonGroup type="radio" name="options"
				   defaultValue={this.props.defaultValue}>
		    <ToggleButton value={true} bsSize="xsmall"
				  onClick={() => {this.props.setVal(true);}}>
			{a}
		    </ToggleButton>
		    <ToggleButton value={false} bsSize="xsmall"
				  onClick={() => {this.props.setVal(false);}}>
			{b}
		    </ToggleButton>
		</ToggleButtonGroup>
	    </ButtonToolbar>);
    }
}

class ByExpTissueTissueMax extends React.Component {
    render(){
	const a = "Experiment";
	const b = "Tissue";
	const c = "Tissue Max";
	return (
	    <ButtonToolbar style={{display: "flex", justifyContent: "center"}}>
		<ToggleButtonGroup type="radio" name="options" 
				   defaultValue={this.props.defaultValue}>
		    <ToggleButton value={1} bsSize="xsmall"
				  onClick={() => {this.props.setVal(1);}}>
			{a}
		    </ToggleButton>
		    <ToggleButton value={2} bsSize="xsmall"
				      onClick={() => {this.props.setVal(2);}}>
			{b}
		    </ToggleButton>
		    <ToggleButton value={3} bsSize="xsmall"
				  onClick={() => {this.props.setVal(3);}}>
			    {c}
		    </ToggleButton>
		    </ToggleButtonGroup>
	    </ButtonToolbar>);
    }
}

class ControlBar extends React.Component {
    constructor(props) {
	super(props);
	this.isTpm = true;
	this.isLinear = false;
	this.isSingle = false;
	this.sampleTisOrTisMax = 2;
    }

    setView(){
	const lookup1 = {true: {true: ["byExpressionTPM", "rawTPM"],
				false: ["byExpressionTPM", "logTPM"]},
			 false: {true: ["byExpressionFPKM", "rawFPKM"],
				 false: ["byExpressionFPKM", "logFPKM"]}};
	const lookup2 = {true: {true: ["byTissue", "rawTPM"],
				false: ["byTissue", "logTPM"]},
			 false: {true: ["byTissue", "rawFPKM"],
				 false: ["byTissue", "logFPKM"]}};
	const lookup3 = {true: {true: ["byTissueMaxTPM", "rawTPM"],
				false: ["byTissueMaxTPM", "logTPM"]},
			 false: {true: ["byTissueMaxFPKM", "rawFPKM"],
				 false: ["byTissueMaxFPKM", "logFPKM"]}};
	let r = [];
	if(1 === this.sampleTisOrTisMax){
	    r = lookup1[this.isTpm][this.isLinear];
	} else if(2 === this.sampleTisOrTisMax){
	    r = lookup2[this.isTpm][this.isLinear];
	} else if(3 === this.sampleTisOrTisMax){
	    r = lookup3[this.isTpm][this.isLinear];
	}
	this.props.changeView(this.isSingle, r[0], r[1]);
    }
    
    render(){
	const buttons = [
	    <div className="row" key="grouping">
		<div className="col-md-12">
		    {panelize("Group by",
			      React.createElement(ByExpTissueTissueMax, 
						  {defaultValue: this.sampleTisOrTisMax,
						   setVal: (v) => {
						       this.sampleTisOrTisMax = v;
						       this.setView();}}
			      ), null, null, {display: "flex", justifyContent: "center"})}
		</div>
	    </div>,
	    <div className="row" key="datascale">
		<div className="col-md-4" style={{paddingRight: "0px"}}>
		    {panelize("TPM/FPKM", 
			      React.createElement(TmpFpkmBox,
						  {defaultValue: this.isTpm,
						   setVal: (v) => {
						       this.isTpm = v;
						       this.setView();}}
			      ), null, null, {display: "flex", justifyContent: "center"})}
		</div>
		<div className="col-md-4" style={{paddingLeft: "2px", paddingRight: "2px"}}>
		    {panelize("Scale",
			      React.createElement(LinearLogBox,
						  {defaultValue: this.isLinear,
						   setVal: (v) => {
						       this.isLinear = v;
						       this.setView();}}
			      ), null, null, {display: "flex", justifyContent: "center"})}
		</div>
		<div className="col-md-4" style={{paddingLeft: "0px"}}>
		    {panelize("Replicates",
			      React.createElement(RepBox,
						  {defaultValue: this.isSingle,
						   setVal: (v) => {
						       this.isSingle = v;
						       this.setView();}}))}
		</div>
	    </div>];
	
	return(
	    <div className="row">
		<div className="col-md-4">
		    {buttons}
		</div>
		<div className="col-md-3">
	 	    {React.createElement(BiosampleTypesBox, this.props)}
		</div>
		{"mm10" !== this.props.assembly &&
		 <div className="col-md-2">
		     {React.createElement(CellCompartmentsBox, this.props)}
		 </div>}
	    </div>);
    }
}

export default ControlBar;
