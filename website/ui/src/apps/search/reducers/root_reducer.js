import {obj_assign, obj_remove, array_remove, array_insert, array_contains} from '../../../common/common'
import FacetboxReducer from './facetbox_reducer'
import TabReducer from './tab_reducer'
import SearchBoxReducer from '../../../common/reducers/searchbox'
import ExpressionMatrixReducer from './expression_matrix_reducer'

import {MainTabsConnector} from '../components/maintab'
import {MainSearchBoxConnector} from '../../../common/components/searchbox'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export const SEARCHBOX_ACTION = 'SEARCHBOX_ACTION';

export const ADD_RESULTS_DISPLAY = 'ADD_RESULTS_DISPLAY';
export const RESULTS_DISPLAY_ACTION = 'RESULTS_DISPLAY_ACTION';

export const CREATE_TABLE = 'CREATE_TABLE';
export const SET_TABLE_RESULTS = 'SET_TABLE_RESULTS';
export const TOGGLE_CART_ITEM = 'TOGGLE_CART_ITEM';

export const EXPRESSION_MATRIX_ACTION = 'EXPRESSION_MATRIX_ACTION';

export const DETAILS_FETCHING = 'DETAILS_FETCHING';
export const DETAILS_DONE = 'DETAILS_DONE';
export const UPDATE_DETAIL = 'UPDATE_DETAIL';
export const SET_DETAIL_TAB = 'SET_DETAIL_TAB';

export const TAB_ACTION = 'TAB_ACTION';

export const UPDATE_COMPARISON = 'UPDATE_COMPARISON';

export const DO_NAV = 'DO_NAV';

export const default_state = (tabs) => {return {
    facet_boxes: {},
    results: {
	query: {},
	hits: [],
	order: [],
	columns: [],
	cart_list: [],
	total: 0,
	fetching: false
    },
    re_detail: {
	q: {
	    accession: "",
	    coord: {
		start: 0,
		end: 0,
		chrom: ""
	    }
	},
	data: {},
	expression_matrices: ExpressionMatrixReducer(),
	tab_selection: 0
    },
    main_tabs: tabs,
    comparison: {
	threshold: 1000,
	rank_type: "enhancer"
    },
    results_displays: {},
    searchbox: {
	value: ""
    }
}};

export const main_tab_connector = MainTabsConnector(
    (state) => (state.main_tabs),
    (dispatch) => ((action) => {
	dispatch({
	    type: TAB_ACTION,
	    target: "main_tabs",
	    subaction: action
	});
    })
);

export const main_searchbox_connector = MainSearchBoxConnector(
    (state) => (state.searchbox),
    (dispatch) => ((action) => {
	dispatch({
	    type: SEARCHBOX_ACTION,
	    target: "searchbox",
	    subaction: action
	});
    })
);	    

export const get_root_reducer = (tabs) => (state = default_state(tabs), action) => {

    if (null == action) {
        return state;
    }

    switch (action.type) {

    case ADD_FACETBOX:
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, {
		visible: action.visible,
		title: action.title,
		facets: action.facets,
		display_map: action.display_map
	    })
	});

    case DO_NAV:
	window.location.href = action.url + "?q=" + state.searchbox.value;
	return state;

    case EXPRESSION_MATRIX_ACTION:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		expression_matrices: ExpressionMatrixReducer(state.re_detail.expression_matrices, action.subaction)
	    })
	});
	
    case RESULTS_DISPLAY_ACTION:
	if (!(action.key in state.results_displays)) return state;
	var n_item = state.results_displays[action.key].reducer(state.results_displays[action.key], action.subaction);
	return Object.assign({}, state, {
	    results_displays: obj_assign(state.results_displays, action.key, n_item)
	});
	
    case FACETBOX_ACTION:

	/*
	 *  pass this action on to the specified facetbox if it exists
	 */
	if (!(action.key in state.facet_boxes)){
            return state;
        }
	var n_item = FacetboxReducer(state.facet_boxes[action.key],
                                     action.subaction);
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, n_item)
	});

    case RESULTS_FETCHING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: true
	    })
	});

    case ADD_RESULTS_DISPLAY:
	var n_rd = Object.assign({}, state.results_displays);
	n_rd[action.key] = action.results_display;
	return Object.assign({}, state, {
	    results_displays: n_rd
	});

    case RESULTS_ERROR:
	console.log("RESULTS_ERROR:", action.requestobj);

    case RESULTS_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: false,
		total: action.results.results.total
	    })
	});

    case CREATE_TABLE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		columns: action.columns,
		order: action.order
	    })
	});

    case SET_TABLE_RESULTS:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		hits: action.hits
	    })
	});

    case TOGGLE_CART_ITEM:
	var n_cart_list =
            (array_contains(state.results.cart_list, action.accession)
	     ? array_remove(state.results.cart_list, action.accession)
	     : array_insert(state.results.cart_list, action.accession));

	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		cart_list: n_cart_list
	    })
	});

    case SEARCHBOX_ACTION:
	return Object.assign({}, state, {
	    searchbox: SearchBoxReducer(state[action.target], action.subaction)
	});

    case UPDATE_DETAIL:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, action.response, {
		tab_selection: 0,
		expression_matrices: Object.assign({}, ExpressionMatrixReducer(), {
		    loading: false,
		    matrices: action.response.data.expression_matrices
		})
	    })
	});

    case SET_DETAIL_TAB:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		tab_selection: action.tab_selection
	    })
	});

    case TAB_ACTION:
	var n_state = Object.assign({}, state);
	n_state[action.target] = TabReducer(n_state[action.target], action.subaction);
	return n_state;
	
    }

    return state;

}
