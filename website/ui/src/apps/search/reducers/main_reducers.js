import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'

const main_reducers = (state, action) => {
    const doToggle = (oldSet, item) => {
        let ret = new Set(oldSet);
        if(ret.has(item)){
            ret.delete(item);
        } else {
            ret.add(item);
        }
        return ret;
    }

    switch (action.type) {

    case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
    case Actions.SET_CHROM: return {...state, coord_chrom: action.chrom };
    case Actions.SET_COORDS: return {...state, coord_start: action.start,
                                     coord_end: action.end };
    case Actions.TOGGLE_TF: {
        return { ...state,
                 tfs_selection: doToggle(state.tfs_selection, action.tf)}
    }
    case Actions.SET_TFS_MODE: return { ...state, tfs_mode: action.mode};
    case Actions.SET_ACCESSIONS: return {...state, accessions: action.accs};

    case Actions.SET_GENE_ALL_DISTANCE:
        return {...state, gene_all_start: action.start, gene_all_end: action.end };
    case Actions.SET_GENE_PC_DISTANCE:
        return {...state, gene_pc_start: action.start, gene_pc_end: action.end };

    case Actions.SHOW_MAIN_TABS:
        return {...state, maintabs_visible: action.show };
    case Actions.SET_MAIN_TAB:
        var ret = {...state, maintabs_active: action.name}
        ret.maintabs = {...state.maintabs};
        ret.maintabs[action.name].visible = true;
        return ret;

    case Actions.TOGGLE_CART: {
        return { ...state,
                 cart_accessions: doToggle(state.cart_accessions,
                                           action.accession)}
    }

    case SearchAction.MAKE_SEARCH_QUERY:
        console.log("new query", action.q);
        return state;

    default:
      return state;
  }
};

export default main_reducers;
