import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import NavBarApp from '../../common/components/navbar_app'
import SearchBox from '../../common/components/searchbox'
import FacetBoxen from './components/facetboxen'
import MainTabs from './components/maintabs'

import main_reducers from './reducers/main_reducers'
import {isCart} from '../../common/utility'

import initialState from './config/initial_state'

import AppPageBase from '../../common/app_page_base'

class SearchPageInner extends React.Component {
    render() {
	const store = createStore(main_reducers,
				  initialState(this.props.search,
					       this.props.globals),
				  applyMiddleware(
				      thunkMiddleware,
				  ));
	let drawMain = () => {
	    if(isCart()){
		return (
		    <div className="row" style={{width: "100%"}}>
			<div className="col-md-12" id="tabs-container">
                            <MainTabs />
			</div>
		    </div>);
	    } else {
		return (
                    <div className="row" style={{width: "100%"}}>
			<div className="col-md-3 nopadding-right"
			     id="facets-container">
                            <FacetBoxen globals={this.props.globals} />
			</div>
			<div className="col-md-9 nopadding-left"
			     id="tabs-container">
			    <MainTabs globals={this.props.globals}
				      search={this.props.search}
			    />
			</div>
		    </div>);
	    }
	}

        return (
            <Provider store={store}>
	        <div>
		    <nav id="mainNavBar"
                         className="navbar navbar-default navbar-inverse navbar-main">
		        <div className="container-fluid" id="navbar-main">
                            <NavBarApp assembly={this.props.search.assembly}
				       show_cartimage={true}
                                       searchbox={SearchBox} />}/>
                        </div>
		    </nav>

		    <div className="container" style={{width: "100%"}}>
			{drawMain()}

                    </div>
		</div>
            </Provider>
        );
    }
}

class SearchPage extends AppPageBase {
    constructor(props) {
	super(props, "/searchws/search", SearchPageInner);
    }
}

export default SearchPage;
