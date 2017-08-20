import React from 'react';
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import MainTabs from './components/maintabs'

import main_reducers from './main_reducers'
import initialState from './config/initial_state'

import { FigureLegends, FigureTitles, ExtendedLegends, ExtendedTitles,
         FigureHeaders, ExtFigureHeaders } from './common/figurelegends'
import SupplementaryTables from './common/supplementarytables'

import './App.css';

let Globals = {
    legends: FigureLegends(),
    titles: FigureTitles(),
    extlegends: ExtendedLegends(),
    exttitles: ExtendedTitles(),
    headers: FigureHeaders(),
    extheaders: ExtFigureHeaders(),
    tables: SupplementaryTables()
};

class App extends React.Component {
    render() {
	const store = createStore(main_reducers,
				  initialState(),
				  applyMiddleware(
				      thunkMiddleware,
				  ));
	return (
            <Provider store={store}>
		<div>
		    <nav className="navbar navbar-default navbar-inverse">
			<div className="container-fluid">
			    <div className="navbar-header">
				<a className="navbar-brand" href="#">
				    ENCODE Encyclopedia V4</a>
			    </div>
			</div>
		    </nav>
		    
		    <div className="row" style={{width: "100%"}}>
		        <div className="col-xs-1"/>
		        <div className="col-xs-10 nopadding-left" id="tabs-container">
		            <MainTabs globals={Globals} />
		        </div>
		        <div className="col-xs-1"/>
		    </div>
		</div>
            </Provider>
	)
    }
}

export default App;