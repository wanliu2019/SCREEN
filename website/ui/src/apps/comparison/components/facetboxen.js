import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import RangeFacet from '../../../common/components/range'
import ListFacet from '../../../common/components/list'
import ChecklistFacet from '../../../common/components/checklist'
import LongListFacet from '../../../common/components/longlist'
import LongChecklistFacet from '../../../common/components/longchecklist'
import SliderFacet from '../../../common/components/slider'

import {default_margin} from '../config/constants'
import {render_int, render_cell_type} from '../config/results_table'

import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

import {panelize} from '../../../common/utility'

const rangeBox = (title, range, start, end, action, _f) => {
    return (<RangeFacet
            title={title}
	    range={range}
	    selection_range={[start, end]}
	    h_margin={default_margin}
	    h_interval={(end - start) / 500}
            onchange={(se) => { action(se[0], se[1])}}
	    rendervalue={_f}
            />);
}

const make_ct_friendly = (ct) => (Globals.cellTypeInfo[ct]["name"]);

const accessionsBox = ({accessions, actions}) => {
    if(0 == accessions.length){
        return (<div />);
    }
    return panelize("Accessions",
                    <ChecklistFacet
                    title={""}
		    formatter={(v) => (v.toUpperCase())}
                    items={accessions.map((d) => {return {value: d, checked: true}})}
                    match_mode_enabled={false}
                    mode={CHECKLIST_MATCH_ANY}
                    autocomplete_source={[]}
		    onchange={(accs) => { actions.setAccessions(accs) }}
		    onModeChange={null}
		    />);
}

const cellTypesBox = ({cellType, actions}) => {
    return panelize("Cell types",
                    <LongListFacet
                    title={""}
                    data={Globals.cellTypeInfoArr}
                    cols={[
		        { title: "cell type", data: "name",
		          className: "dt-right" },
		        { title: "tissue", data: "tissue",
		            className: "dt-right" }
	            ]}
                    order={[]}
                    selection={cellType}
                    friendlySelectionLookup={make_ct_friendly}
                    onTdClick={(value) => { actions.setCellType(value) }}
                    />);
}

const chromBox = ({coord_chrom, actions}) => {
    return panelize("Chromosome",
	            <ListFacet
                    title={""}
                    items={Globals.chromCounts}
                    selection={coord_chrom}
                    onchange={(chrom) => { actions.setChrom(chrom) }}
                    />);
}

const startEndBox = ({coord_chrom, coord_start, coord_end, actions}) => {
    if(null == coord_chrom){
        return (<div />);
    }
    var chromLen = Globals.chromLens[coord_chrom];
    var histBins = Globals.creHistBins[coord_chrom];
    return panelize("Coordinates",
                    <RangeFacet
                    title={""}
                    h_data={histBins}
	            range={[0, chromLen]}
	            selection_range={[coord_start, coord_end]}
	            h_margin={default_margin}
	            h_interval={chromLen / histBins.numBins}
                    onchange={(se) => { actions.setCoords(se[0], se[1]) }}
                    />);
}

const tfBox = ({actions}) => {
    return panelize("Intersect TF/histone/DNase peaks",
                    <LongChecklistFacet
                    title={""}
                    data={Globals.tfs.map((tf) => {return {key: tf,
                                                         selected: false}})}
                    cols={[{
		        title: "Assay", data: "key",
		        className: "dt-right"
	            }]}
                    order={[]}
                    match_mode_enable={true}
                    onTdClick={(tf) => { actions.toggleTf(tf) } }
                    onModeChange={(mode) => { actions.setTfsMode(mode) }}
                    mode={CHECKLIST_MATCH_ALL}
                    />);
}

const geneDistanceBox = ({gene_all_start, gene_all_end, gene_pc_start,
                          gene_pc_end, actions}) => {
			      let range = [0, 500000];
    return panelize("Distance to Genes",
                    (<div>
                     {rangeBox("Protein-coding genes", range, gene_pc_start, gene_pc_end,
                               actions.setGenePcDistance)}
                     {rangeBox("All genes", range, gene_all_start, gene_all_end,
                               actions.setGeneAllDistance)}
                     </div>))
}

const zscore_decimal = (v) => (v / 100.0);

const rankBox = ({rank_dnase_start, rank_dnase_end,
                  rank_promoter_start, rank_promoter_end,
                  rank_enhancer_start, rank_enhancer_end,
                  rank_ctcf_start, rank_ctcf_end,
                  cellType, actions}) => {
		      let range = [-1000, 1000];
    if(null == cellType){
        return (<div />);
    }
	      return panelize("Z-Score: " + make_ct_friendly(cellType),
                    (<div>
                     {rangeBox("DNase", range, rank_dnase_start, rank_dnase_end,
                               actions.setRankDnase, zscore_decimal)}
                     {rangeBox("promoter", range, rank_promoter_start, rank_promoter_end,
                               actions.setRankPromoter, zscore_decimal)}
                     {rangeBox("enhancer", range, rank_enhancer_start, rank_enhancer_end,
                               actions.setRankEnhancer, zscore_decimal)}
                     {rangeBox("CTCF", range, rank_ctcf_start, rank_ctcf_end,
                               actions.setRankCtcf, zscore_decimal)}
                     </div>));
};

class FacetBoxen extends React.Component {
    componentDidMount() {
        if(!this.props.maintabs_visible){
            this.props.actions.showMainTabs(true);
        }
    }

    doRender(p){
        return (<div>
                {accessionsBox(p)}
                {cellTypesBox(p)}
                {chromBox(p)}
                {startEndBox(p)}
                {rankBox(p)}
                </div>);
    } /*                 {tfBox(p)}
                {geneDistanceBox(p)} */

    render() {
        return this.doRender(this.props)
    }
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FacetBoxen);