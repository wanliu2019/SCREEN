class MainTabs extends React.Component {
    render(){
        const makeTabTitle = (key, tab) => {
            if(!tab.visible){ return (<div />) }
            let active = key == this.props.maintabs_active;
	    return (<li className={active ? "active" : ""}
                    key={"tab_" + key}
	            style={{display: (tab.visible ? "list-item" : "none") }}
	            onClick={ () => { this.props.actions.setMainTab(key) } }>
                    <a data-toggle="tab">{tab.title}</a>
                    </li>);
        }

        const makeTab = (key, tab) => {
            if(!tab.visible){ return (<div />) }
            let active = key == this.props.maintabs_active;
            return (<div
                    className={active ? "tab-pane active" : "tab-pane"}
                    key={"tab_" + key}
                    id={"tab_main_" + key}
                    key={"tcontent_" + key}>
		    {React.createElement(tab.f, this.props)}
		    </div>);
        }

        let tabs = this.props.maintabs;
        return (<div id="exTab1" className="container">

	        <ul className="nav nav-tabs">
	        {Object.keys(tabs).map((key) => ( makeTabTitle(key, tabs[key]) ))}
                </ul>

	        <div className="tab-content clearfix">
	        {Object.keys(tabs).map((key) => ( makeTab(key, tabs[key]) ))}
	        </div>

                </div>);
    }
}
export default MainTabs;