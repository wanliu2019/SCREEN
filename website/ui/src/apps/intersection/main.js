import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import NavBarApp from '../../common/components/navbar_app'
import SearchBox from '../../common/components/searchbox'
import MainTabs from './components/maintabs'

import main_reducers from './reducers/main_reducers'
import initialState from './config/initial_state'

class IntersectionApp extends React.Component {
    
    render() {
	const store = createStore(
	    main_reducers, initialState(),
	    applyMiddleware(
		thunkMiddleware,
	    )
	);

        return (<Provider store={store}>
	            <div>
		        <nav id="mainNavBar"
                          className="navbar navbar-default navbar-inverse navbar-main">
		            <div className="container-fluid" id="navbar-main">
                                <NavBarApp show_cartimage={false} searchbox={SearchBox} />}/>
                            </div>
		        </nav>

		        <div className="container" style={{width: "100%"}}>
                            <div className="row" style={{width: "100%"}}>
                                <div className="col-md-12 nopadding-left" id="tabs-container">
                                    <MainTabs />
                                </div>
                            </div>

                        </div>
		    </div>
                </Provider>);
    }
}

export default IntersectionApp;
