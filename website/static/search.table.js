function RE_table(){
    this.callback = null;
    this.no_cart = false;
};

RE_table.prototype.genStrCol = function(field){
    return { data: field, className: "dt-right"};
}

RE_table.prototype.genFloatCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 1, '' ) };
}

RE_table.prototype.genIntCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 0, '' ) };
}

RE_table.prototype.genButtonGroupCol = function(names){
    var bg = '<div class="btn-group" role="group">';
    for(i = 0; i < names.length; i++){
        bg += '<button type="button" class="btn btn-default btn-xs">' + names[i] +
            '</button>';
    }
    bg += '</div>';
    return { targets: -1, data: null, className: "dt-right browser", orderable: false,
             defaultContent : bg };
}

RE_table.prototype.disable_cart_icons = function() {
    this.no_cart = true;
};

function cart_img(rmv, src_only)
{
    var src = "/ver4/search/static/cart" + (rmv ? "rmv" : "add") + ".png";
    return (src_only ? src : "<img src='" + src + "' width='56' height='56'>");
}

RE_table.prototype.genCartCol = function(field) {
    return {data: field, render: function(d) {return cart_img(cart.has_item(d), false)},
	    className: "cart"};
};

RE_table.prototype.setupColumns = function(){
    var ret = {accession : this.genStrCol("_source.accession"),
	       "&#8209;log(p)" : this.genFloatCol("_source.confidence"),
               //Genome : this.genStrCol("_source.genome"),
	       chr : this.genStrCol("_source.position.chrom"),
               start : this.genIntCol("_source.position.start"),
	       end : this.genIntCol("_source.position.end")}


    ret["nearest gene"] = this.genStrCol("_source.genes.nearest-all.gene-id");
    ret["nearest protein-coding gene"] =
        this.genStrCol("_source.genes.nearest-pc.gene-id");

    if (!this.no_cart) ret["cart"] = this.genCartCol("_source");
    ret["genome browsers"] = this.genButtonGroupCol(["UCSC", "WashU", "Ensembl"]);

    return ret;
}

RE_table.prototype.makeEmptyTable = function(cols){
    var colNames = _.keys(cols);

    var frag = document.createDocumentFragment();
    for(i = 0; i < colNames.length; i++){
        var th = document.createElement("th");
        th.innerHTML = colNames[i];
        frag.appendChild(th);
    }
    var tr = document.createElement("tr");
    tr.appendChild(frag)
    var thead = document.createElement("thead");
    thead.appendChild(tr);
    var table = document.createElement("table");
    table.id = this.tableDom.substring(1);
    table.appendChild(thead);

    return table;
}

RE_table.prototype.setCallback = function(f){
    this.callback = f;
}

RE_table.prototype.runCallback = function(f){
    if(this.callback){
	this.callback();
	this.callback = null;
    }
}

RE_table.prototype.result_from_tablerow = function(tr){
    var data = this.dtable.row(tr).data();
    return data["_source"];
}

RE_table.prototype.result_from_tablerow_child = function(t){
    var data = this.dtable.row(t.parents('tr')).data();
    return data["_source"];
}

RE_table.prototype.makeTable = function(outerDiv){
    var cols = this.setupColumns();
    
    $(outerDiv).html(this.makeEmptyTable(cols));
    
    var dtable = $(this.tableDom).DataTable( {
        destroy: true,
        processing: true,
        columns: _.values(cols),
        order: [[1, "desc"],
        	[3, "asc"],
        	[4, "asc"]
               ],
	bFilter: false,
	serverSide: true,
	ajax: function ( request, callback, settings ) {
	    var requestStart  = request.start;
	    var requestLength = request.length;
	    
	    searchquery.eso["from"] = requestStart;
	    searchquery.eso["size"] = requestLength;
	    
	    re_table.setCallback(function(){
		var numFil = results.results.total;
		if(numFil > 5000){
		    numFil = 5000;
		}
		var json = {
		    data : results.results.hits,
		    recordsTotal : results.results.total,
		    recordsFiltered : numFil
		};
		callback(json);
	    });
	    
	    perform_search();
	}
    } );

    $(this.tableDom).removeClass('display')
	.addClass('table table-condensed table-hover');
    
    return dtable;
}

RE_table.prototype.browserClick = function(){
    var _this = this;
    
    // deal w/ genome browser button click
    $(this.tableDom + ' tbody').on( 'click', 'button', function () {
	var whichBrowser = $(this).html();
	var i = $(this);
	var data = _this.result_from_tablerow_child(i);
        var reAccession = data["accession"];
        //console.log(whichBrowser, reAccession);
	//console.log(data);

	var halfWindow = 7500;
	
	if("UCSC" == whichBrowser){
	    var  url = "https://genome.ucsc.edu/cgi-bin/hgTracks?";
	    url += "db=hg19";

	    var chrom = data["position"]["chrom"]
	    var start = data["position"]["start"];
	    var end = data["position"]["end"];
	    
	    start = Math.max(1, start - halfWindow);
            end = end + halfWindow;
	    
	    url += "&position=" + chrom + ':' + start + '-' + end;
	    	    
            var trackhubUrl = "http://megatux.purcaro.com:9002" +
		[Ver(),
                 "ucsc_trackhub",
		 reAccession,
		 "hub_" + Session_Uid + ".txt"].join('/');

	    url += "&hubClear=" + trackhubUrl;

	    window.open(url, '_blank');
	}
	
    } );
}

RE_table.prototype.rowClick = function() {
    var _this = this;
    
    // deal w/ RE row click
    $(this.tableDom).on( 'click', 'td', function() {

	// browser, cart columns handled separately
	if (this.className.indexOf("cart") != -1
	    || this.className.indexOf("browser") != -1) { return };

	var i = $(this);
	var r = _this.result_from_tablerow_child(i);

	$("#redetails").html("");
	regelm_details_view.bind("redetails");

	showTab("tab_details");
	
	request_details(r);
	
	regelm_details_view.set_header(r.accession);
	regelm_details_view.peak_overlap_view.set_loading_text();
	regelm_details_view.tf_view.set_loading_text();
	regelm_details_view.histones_view.set_loading_text();	
	regelm_details_view.snp_view.set_loading_text();
	regelm_details_view.genes_view.set_loading_text();
	regelm_details_view.re_view.set_loading_text();

	regelm_details_view.ranking_view.load_cell_lines(
	    regelm_details_base.reformat_ranks(r.ranks));

	$("#detailsLeftArrow").click(function(){
	    showTab("tab_results");
	});
	
	_this.showPileup(r);
    });
}

RE_table.prototype.cartClick = function() {
    var _this = this;

    $(this.tableDom).on( 'click', 'img', function() {
	var i = $(this);
	var r = _this.result_from_tablerow_child(i);
	if (cart.has_item(r)) {
	    cart.remove_item(r);
	} else {
	    cart.add_item(r);
	}
	i.attr("src", cart_img(cart.has_item(r), true));
    });
};

RE_table.prototype.renderTable = function(){
    var outerDiv = "#searchresults";
    this.tableDom = outerDiv + "_table";

    this.dtable = this.makeTable(outerDiv);
    
    this.browserClick();
    this.cartClick();
    this.rowClick();
}

RE_table.prototype.showPileup = function(re){
    //console.log(re);
    var pos = re.position;
    
    var div = document.getElementById("repileup");
    var p = pileup.create(div, {
	range: {contig: pos.chrom, start: pos.start, stop: pos.end},
	tracks: [
	    {
		viz: pileup.viz.genome(),
		isReference: true,
		data: pileup.formats.twoBit({
		    url: 'http://www.biodalliance.org/datasets/hg19.2bit'
		}),
		name: 'Reference'
	    },
	]
    });
}
