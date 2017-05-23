import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {doToggle} from '../../../common/utility'

const mainTabSetter = (state, tabName) => {
    let ret = {maintabs_active: tabName};
    ret.maintabs = {...state.maintabs};
    ret.maintabs[tabName].visible = true;
    return ret;
}

const main_reducers = (state, action) => {
    
    switch (action.type) {
	    
    case Actions.SET_STUDY:
        return { ...state, gwas_study: action.s};
	
    case Actions.SET_MAIN_TAB:
        return {...state, ...mainTabSetter(state, action.name)};
	
    case Actions.SET_CELLTYPE:
	return {...state, cellType: action.ct};
	
    case Actions.SET_GWAS_CELL_TYPES:
        return {...state, gwas_cell_types: action.cts};
	
    case Actions.SET_GWAS_STUDY_TAB:
	return {...state, gwas_study_tab: action.tab};
	
    case SearchAction.MAKE_SEARCH_QUERY:
        console.log("new query", action.q);
        return state;
	
    case Actions.SHOW_GENOME_BROWSER:
	let ret = {...state, ...mainTabSetter(state, "configgb"),
		   configuregb_cre: action.cre,
		   configuregb_type: action.etype ? action.etype : "cre",
		   configuregb_browser: action.name,
		   configuregb_cts: state.configuregb_cts.map(x => ({
			   ...x,
		       checked: x.checked || (x.cellTypeName && x.cellTypeName == state.cellType)
		   }))
		  };
	return ret;
	
    case Actions.TOGGLE_GENOME_BROWSER_CELLTYPE:
	return {
	    ...state,
	    configuregb_cts: state.configuregb_cts.map(x => ({
		...x, checked: (x.cellTypeName == action.ct) != x.checked
	    }))
	};
		
    default:
	return state;
    }
};

export default main_reducers;
