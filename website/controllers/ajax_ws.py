#!/usr/bin/env python

from __future__ import print_function

import os, sys, json
import time
import StringIO
import zipfile
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap
from models.correlation import Correlation
from models.cytoband import Cytoband
from models.bigwig import BigWig

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from compute_gene_expression import ComputeGeneExpression

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import Autocompleter
from load_cell_types import LoadCellTypes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../heatmaps/API"))
from heatmaps.heatmap import Heatmap

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer

class AjaxWebServiceWrapper:
    def __init__(self, args, es, ps, cache, staticDir):
        def makeAWS(a):
            return AjaxWebService(args, es[a], ps, cache[a], staticDir, a)
        self.ajws = { "hg19" : makeAWS("hg19"),
                      "mm10" : makeAWS("mm10") }

    def process(self, j):
        if "GlobalAssembly" not in j:
            j["GlobalAssembly"] = "mm10"
            raise Exception("GlobalAssembly not defined")
        return self.ajws[j["GlobalAssembly"]].process(j)

class AjaxWebService:

    _default_fields = ["accession", "neg-log-p",
                       "position.chrom", "position.start",
                       "position.end", "genes.nearest-all",
                       "genes.nearest-pc", "in_cart"]

    def __init__(self, args, es, ps, cache, staticDir, assembly):
        self._rank_types = { "DNase": ("dnase", ""),
                             "Enhancer": ("enhancer", ".H3K27ac-Only"),
                             "Promoter": ("promoter", ".H3K4me3-Only"),
                             "CTCF": ("ctcf", ".CTCF-Only") }
        self._bigwig_keys = {"dnase": None,
                             "enhancer": "h3k27ac",
                             "promoter": "h3k4me3",
                             "ctcf": "ctcf" }

        self.assembly = assembly
        self.args = args
        self.es = es
        self.ps = ps
        self.rh = RankHeatmap(cache.cellTypesAndTissues,
                              self._rank_types)
        self.cache = cache
        self.cg = ComputeGeneExpression(self.es, self.ps, self.cache, self.assembly)
        self.cytobands = Cytoband(paths.cytobands[assembly])

        self.em = ExpressionMatrix(self.es)
        self.details = RegElementDetails(es, ps, assembly, cache)
        self.ac = Autocompleter(es, assembly)
        self.regElements = RegElements(es, assembly)

        self.staticDir = staticDir

        self.cmap = {"regulatory_elements": RegElements,
                     "expression_matrix": ExpressionMatrix}

        self.actions = {"enumerate": self._enumerate,
                        "re_detail": self._re_detail,
                        "peak_detail" : self._peaks_detail,
                        "suggest" : self._suggest,
                        "query": self._query,
                        "search": self._search,
                        "venn": self._venn_search,
                        "gene_regulators": self._gene_regulators,
                        "re_genes": self._re_genes,
                        "tree": self._tree,
                        "helpkey": self._helpkey,
                        "venn_chr": self._venn_chr,
                        "tree_comparison": self._tree_comparison }
        self._cached_results = {}

    def _tree_comparison(self, j):

        def tree_comparison_query(cts, ncts):
            return {"should": [{"range": {"ranks.dnase." + ct + ".rank": {"lte": 20000}}} for ct in cts],
                    "must": [{"range": {"ranks.dnase." + ct + ".rank": {"gte": 20000}}} for ct in ncts] }

        def search(q):
            return self.es.search(body={"query": {"bool": q}, "size": 100},
                                  index=paths.reJsonIndex(self.assembly))

        def process(r):
            tfs = {}
            _il = 0.01
            for hit in r["hits"]["hits"]:
                for tf, a in hit["_source"]["peak_intersections"]["tf"].iteritems():
                    if tf not in tfs: tfs[tf] = 0
                    tfs[tf] += _il
            return tfs

        hits = [search(tree_comparison_query(j["left"], j["right"])),
                search(tree_comparison_query(j["right"], j["left"]))]

        tfs = [process(hits[i]) for i in [0, 1]]
        tfa = {}
        for k, v in tfs[0].iteritems():
            tfa[k] = {"left": v,
                      "right": tfs[1].get(k, 0.01)}
        for k, v in tfs[1].iteritems():
            if k not in tfs[0]:
                tfa[k] = {"left": 0.01, "right": v}

        return {"left": hits[0]["hits"]["hits"],
                "right": hits[1]["hits"]["hits"],
                "tfs": {"left": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                        for k, v in tfa.iteritems() if v["left"] - v["right"] > 0],
                                       key=lambda x: x["right"] / x["left"]),
                        "right": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                         for k, v in tfa.iteritems() if v["left"] - v["right"] < 0],
                                        key=lambda x: x["left"] / x["right"]) }}

    def _get_associated_genes(self, accession):
        results = self.es.search(body={"query": {"bool": {"must": {"match": {"accession": accession}}}}},
                                 index="associated_tss")["hits"]["hits"]
        if len(results) == 0: return []
        if len(results) > 1:
            print("warning: too many results in index associated_tss for accession=%s; returning the first" % accession)
        return self.es.genes_from_ensemblids(results[0]["_source"]["proximal-genes"])

    def _helpkey(self, j):
        if "key" not in j: return {}
        data = self.ps.get_helpkey(j["key"])
        if data is None: return {}
        return { "title": data[0],
                 "summary": data[1],
                 "link": data[2] }

    def _get_rank(self, label, v):
        return 1e12 if label not in v else v[label]["rank"]

    def _tissue(self, k):
        return self.cache.getTissueAsMap(k)

    def _format_ranks(self, ranks):
        return {"dnase": [{"tissue": self._tissue(k),
                           "cell_type": k,
                           "rank": v["rank"] } for k, v in ranks["dnase"].iteritems()],
                "promoter": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K4me3": self._get_rank("H3K4me3-Only", v),
                              "H3K4me3_DNase": self._get_rank("DNase+H3K4me3", v) } for k, v in ranks["promoter"].iteritems()],
                "enhancer": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K27ac": self._get_rank("H3K27ac-Only", v),
                              "H3K27ac_DNase": self._get_rank("DNase+H3K27ac", v) } for k, v in ranks["enhancer"].iteritems()],
                "ctcf": [{"tissue": self._tissue(k),
                          "cell_type": k,
                          "ctcf": self._get_rank("CTCF-Only", v),
                          "ctcf_DNase": self._get_rank("DNase+CTCF", v) } for k, v in ranks["ctcf"].iteritems()] }

    def _peak_format(self, peaks):
        ret = []
        for k, v in peaks.iteritems():
            ret.append({"name": k, "n": len(v)})
        return ret

    def _get_bigwigs(self, j, ranktype):
        ret = []
        try:
            r = self._bigwig_keys[ranktype[0]]
            for ct, v in j["ranks"][ranktype[0]].iteritems():
                ret.append(v if r is None else v[ranktype[1]][r])
                ret[-1]["ct"] = ct
        except:
            print("ERROR in _get_bigwigs")
        return ret

    def _get_bigwig_regions(self, bigwigs, accs):
        try:
            q = [{"match": {"accession": acc}} for acc in accs]
            bfnp = [{"path": "/project/umw_zhiping_weng/0_metadata/encode/data/%s/%s.bigWig" % (bigwig["accession"], bigwig["bigwig"]),
                     "ct": bigwig["ct"] } for bigwig in bigwigs]
            results = self.es.search(body={"query": {"bool": {"should": q}}, "size": 11,
                                           "_source": ["accession", "position"]},
                                     index="regulatory_elements_7")["hits"]["hits"]
            results = BigWig.getregions([{"acc": x["_source"]["accession"], "start": x["_source"]["position"]["start"],
                                          "end": x["_source"]["position"]["end"], "chr": x["_source"]["position"]["chrom"]}
                                         for x in results], bfnp, 50)
            for bigwig in bigwigs:
                results[bigwig["ct"]]["max"] = self.cache.bigwigmaxes[bigwig["accession"]] if bigwig["accession"] in self.cache.bigwigmaxes else 0
            return results
        except:
            print("ERROR in _get_bigwig_regions")

    def _re_detail(self, j):
        accession = j["accession"]
        j = self.details.reFull(accession)
        pos = j["position"]

        output = {"type": "re_details",
                  "q": {"accession": accession,
                        "position": pos},
                  "data": {} }

        if "peak_intersections" in j:
            output["data"] = {k: self._peak_format(v)
                              for k, v in j["peak_intersections"].iteritems()}

        output["data"].update(self._format_ranks(j["ranks"]))

        overlapBP = 10000 #10KB
        expanded_coords = {"chrom": pos["chrom"],
                           "start": max(0, pos["start"] - overlapBP),
                           "end": pos["end"] + overlapBP}
        snp_results = self.es.get_overlapping_snps(expanded_coords)

        overlapBP = 1000000 # 1MB
        expanded_coords = {"chrom": pos["chrom"],
                           "start": max(0, pos["start"] - overlapBP),
                           "end": pos["end"] + overlapBP}
#        gene_results = self.es.get_overlapping_genes(expanded_coords)
        re_results = self.es.get_overlapping_res(expanded_coords)
        similaracclist = [j["accession"]] + [k for k, v in sorted(j["most_similar"].iteritems(), key = lambda(k, v): -v)][:10]

        output["data"].update({"overlapping_snps" : self.details.formatSnpsJS(snp_results, pos),
                               "nearby_genes" : j["nearby_genes"],
                               "tads": self._tad_details([x for x in j["genes"]["tads"]]) if "tads" in j["genes"] and j["genes"]["tads"][0] != '' else [],
                               "re_tads": self._re_tad_details([x for x in j["genes"]["tads"]]) if "tads" in j["genes"] and j["genes"]["tads"][0] != '' else [],
                               "nearby_res" : self.details.formatResJS(re_results, pos, accession),
                               "associated_tss": [x["approved_symbol"] for x in self._get_associated_genes(j["accession"])],
                               "most_similar": similaracclist,
                               "regions": self._get_bigwig_regions(self._get_bigwigs(j, self._rank_types["DNase"]), similaracclist) })

        return output

    def _re_tad_details(self, ensembl_list):
        query = []
        for ensembl_id in ensembl_list:
            query.append({"match": {"genes.tads": ensembl_id}})
        retval = self.es.search(body={"query": {"bool": {"should": query}},
                                      "size": 1000,
                                      "_source": ["accession", "position"]},
                                index=paths.reJsonIndex(self.assembly))["hits"]["hits"]
        return [x["_source"] for x in retval]


    def _tad_details(self, ensembl_list):
        return [{"approved_symbol": x["approved_symbol"],
                 "coordinates": x.get("coordinates", "")}
                for x in self.es.genes_from_ensemblids(ensembl_list)]

    def _re_genes(self, j):
        accession = j["accession"]
        return {"type": "re_genes",
                "q": {"accession": accession},
                "data": {"expression_matrices": self._expression_matrix(accession),
                         "candidate_links": self._candidate_links(accession) }}

    def _candidate_links(self, accession):
        link_results = self.es.search(body={"query": {"bool": {"should": [{"match": {"candidate-re": accession}}]}},
                                            "size": 1000},
                                      index="candidate_links")["hits"]["hits"]
        return [x["_source"] for x in link_results]

    def _expression_matrix(self, accession):
        if self.assembly == "mm10": return {}
        matrix = []
        genelists = self._get_genelist(accession)
        ret = {}
        try:
            for title, _list in genelists.iteritems():
                ret[title] = self.em.search(_list)
                matrix = []
                for i in range(0, len(ret[title]["matrix"])):
                    for j in range(0, len(ret[title]["matrix"][0])):
                        matrix.append({"row": i + 1,
                                       "col": j + 1,
                                       "value": ret[title]["matrix"][i][j]})
                ret[title].update({"matrix": matrix})
        except:
            print("ERROR in _expression_matrix")
        return ret

    def _peaks_detail(self, j):
        output = {"type": "peak_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }
        results = self.details.get_intersecting_beds(j["accession"])
        bed_accs = [x[0] for x in results["experiments"]]
        output["peak_results"] = self.details.get_bed_stats(bed_accs)
        return output

    def _suggest(self, j):
        ret = {"type": "suggestions",
               "callback": j["callback"]}
        ret.update(self.ac.get_suggestions(j))
        return ret

    def _enumerate(self, j):
        if "cell_line" == j["name"]:
            r = {"results": self.cache.cellTypesAndTissues}
        else:
            r = self.es.get_field_mapping(index=j["index"],
                                          doc_type=j["doc_type"],
                                          field=j["field"])
        r["name"] = j["name"]
        return r

    def _query(self, j):
        #print(j["object"])
        ret = self.es.search(body=j["object"], index=j["index"])

        if j["callback"] in self.cmap:
            ret = self.cmap[j["callback"]].process_for_javascript(ret,
                                                                  self.assembly)

        ret["callback"] = j["callback"]
        self.ps.logQuery(j, ret, "")
        return ret

    def _get_genelist(self, accession):
        ret = {}

        # handle linear distance and TAD first
        results = self._search({"object": {"query": {"bool": {"must": [{"match": {"accession": accession}}]}}},
                                "post_processing": {}},
                               callback = "", fields = ["genes"])["hits"]["hits"]
        if len(results) > 0:
            results = results[0]
            results_lists = {"Nearest Linearly": (results["_source"]["genes"]["nearest-all"] + results["_source"]["genes"]["nearest-pc"],
                                                  lambda gene: gene["gene-name"])}
            if "tads" in results["_source"]["genes"]:
                results_lists["Within TAD"] = (results["_source"]["genes"]["tads"],
                                               lambda gene: gene)
            for title, v in results_lists.iteritems():
                ret[title] = []
                genelist, f = v
                for gene in genelist:
                    if f(gene) not in ret[title]:
                        ret[title].append(f(gene))

        # handle candidate links
        link_results = self.es.search(body={"query": {"bool": {"must": [{"match": {"candidate-re": accession}}]}}},
                                      index="candidate_links")["hits"]["hits"]
        if len(link_results) > 0:
            title = "Candidate target genes"
            ret[title] = []
            for hit in link_results:
                ret[title].append(hit["_source"]["gene"]["ensemble-id"])

        return ret

    def _gene_regulators(self, j):
        # convert to ensemblid
        fields = ["HGNC_ID", "RefSeq_ID", "UCSC_ID", "UniProt_ID", "Vega_ID", "ensemblid", "mouse_genome_ID",
                  "previous_symbols", "synonyms", "approved_name", "approved_symbol" ]
        ensembl_id = self.es.search(body={"query": {"bool": {"must": [{"multi_match": {"query": j["name"],
                                                                                       "fields": fields}}]}}},
                                    index="gene_aliases")["hits"]["hits"]
        ensembl_id = ensembl_id[0]["_source"]["ensemblid"] if len(ensembl_id) > 0 else "~" # no IDs start with '~'

        # search for matching links
        link_results = self.es.search(body={"query": {"bool": {"should": [{"match_phrase_prefix": {"gene.ensemble-id": ensembl_id}},
                                                                          {"match": {"gene.common-gene-name": j["name"]}}]}},
                                            "size": 1000},
                                      index="candidate_links")["hits"]["hits"]
        return [x["_source"] for x in link_results]

    def process(self, j):
        try:
            if "action" in j:
                action = j["action"]
                if action in self.actions:
                    ret = self.actions[action](j)
                    return ret
                print("unknown action:", action)
                return { "error" : "error running action"}
            return self.regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))

        except:
            raise
            return { "error" : "error running action"}

    def _combine(self, query):
        retval = {"bool": {"must": []}}
        for field in ["query", "post_filter"]:
            if field in query and "bool" in query[field]:
                for _field in query[field]["bool"]:
                    retval["bool"]["must"] += query[field]["bool"][_field]
        return retval

    def _get_rankfield(self, rank_type, cell_type):
        rt1, rt2 = self._rank_types[rank_type]
        return "ranks.%s.%s%s.rank" % (rt1, cell_type, rt2)

    def _run_venn_queries(self, j, basequery):
        if len(j["cell_types"]) < 2:
            return {"rank_range": [],
                    "totals": {},
                    "overlaps": {} }

        fields = {}
        query = { "aggs": {},
                  "query": self._combine(basequery) }

        # first pass: build rank aggs, cell type aggs
        for cell_type in j["cell_types"]:
            fields[cell_type] = self._get_rankfield(j["rank_type"], cell_type)
            query["aggs"][cell_type + "min"] = {"min": {"field": fields[cell_type]}}
            query["aggs"][cell_type + "max"] = {"max": {"field": fields[cell_type]}}
            query["aggs"][cell_type] = {"filter": {"range": {fields[cell_type]: {"lte": j["rank_threshold"]}}},
                                        "aggs": {} }

        # second pass: build comparison aggs
        for cell_type in j["cell_types"]:
            for comparison_ct in j["cell_types"]:
                if cell_type == comparison_ct: continue
                query["aggs"][cell_type]["aggs"][comparison_ct] = {"range": {"field": fields[comparison_ct],
                                                                             "ranges": [{"to": j["rank_threshold"]}]}}


        # do search
        raw_results = self.es.search(body = query, index = paths.reJsonIndex(self.assembly))["aggregations"]
        rank_range = [min([raw_results[cell_type + "min"]["value"] for cell_type in j["cell_types"]]),
                      max([raw_results[cell_type + "max"]["value"] for cell_type in j["cell_types"]]) ]
        totals = {cell_type: raw_results[cell_type]["doc_count"] for cell_type in j["cell_types"]}

        # only two cell types: format as a venn diagram
        if len(j["cell_types"]) == 2:
            return {"rank_range": rank_range, "collabels": [], "rowlabels": [], "matrix": [],
                    "totals": totals,
                    "overlaps": {ct: {cct: raw_results[ct][cct]["buckets"][0]["doc_count"]
                                      for cct in j["cell_types"] if cct != ct } for ct in j["cell_types"] } }

        # more than two cell types: format as a heatmap
        matrix = []
        for ct1 in j["cell_types"]:
            matrix.append([])
            for ct2 in j["cell_types"]:
                if ct1 == ct2:
                    matrix[-1].append(1)
                elif raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"] == 0:
                    matrix[-1].append(0)
                else:
                    matrix[-1].append(raw_results[ct1][ct2]["buckets"][0]["doc_count"] / float(raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"]))
        try:
            if len(matrix) != len(matrix[0]):
                raise Exception("heatmap not square: " + str(len(matrix)) + " vs " + str(len(matrix[0])))
            _heatmap = Heatmap(matrix)
        except:
            raise
        roworder, colorder = _heatmap.cluster_by_both()
        roworder, rowtree = roworder
        colorder, coltree = colorder
        return {"rank_range": rank_range, "totals": [], "overlaps": {},
                "totals": totals,
                "rowlabels": [j["cell_types"][x] for x in roworder],
                "collabels": [j["cell_types"][x] for x in colorder],
                "matrix": matrix }

    def _venn_ct_results(self, basequery, cellTypes, ranktype, threshold, limit = 100):
        ret = {}

        cellTypes = filter(lambda x: x, cellTypes)
        if 2 != len(cellTypes):
            return ret

        # build query for individual result sets
        ctqs = []
        for ct in cellTypes:
            field = self._get_rankfield(ranktype, ct)
            ctqs.append(({"range": {field: {"lte": threshold}}},
                         {"range": {field: {"gte": threshold}}}))

        # get overlapping results
        q = {"query": {"bool": {"must": basequery}},
             "size": limit}
        q["query"]["bool"]["must"] += [ctqs[0][0], ctqs[1][0]]
        ret["both cell types"] = self._search({"object": q, "post_processing": {}})

        # results for each cell type individually
        q["query"]["bool"]["must"] = q["query"]["bool"]["must"][:-2] + [ctqs[0][1], ctqs[1][0]]
        ret[cellTypes[1] + " only"] = self._search({"object": q, "post_processing": {}})
        q["query"]["bool"]["must"] = q["query"]["bool"]["must"][:-2] + [ctqs[0][0], ctqs[1][1]]
        ret[cellTypes[0] + " only"] = self._search({"object": q, "post_processing": {}})

        return ret

    def _venn_search(self, j):
        j["post_processing"] = {}

        cts = self._filterCellTypes(j["table_cell_types"])
        if 2 != len(cts):
            return {}

        ret = {"results": self._search(j),
               "sep_results": {}}

        # for drawing the venn or heatmap
        ret["results"]["venn"] = self._run_venn_queries(j["venn"], j["object"])
        # for results tables
        ret["sep_results"] = self._venn_ct_results(j["object"]["query"]["bool"]["filter"],
                                                       j["table_cell_types"], j["venn"]["rank_type"],
                                                       j["venn"]["rank_threshold"])

        return ret

    def _filterCellTypes(self, cts):
        cts = filter(lambda x: x, cts)
        # http://stackoverflow.com/a/17016257
        from collections import OrderedDict
        return list(OrderedDict.fromkeys(cts))

    def _venn_chr(self, j):
        cts = self._filterCellTypes(j["table_cell_types"])

        ret = {"sep_results": {},
               "fold_changes": {}}

        if 2 != len(cts):
            return ret;

        ret["sep_results"] = self._venn_ct_results([], cts, "DNase", 5000, 500)
        ret["fold_changes"] = self.cg.computeFoldChange(cts[0], cts[1])

        for chrom, band in self.cytobands.bands.iteritems():
            ret[chrom] = {"cytobands": band}
        return ret

    def _tree(self, j):
        j["object"]["_source"] = ["ranks"]
        with Timer('ElasticSearch time'):
            """_ret = self._query({"object": j["object"],
                                "index": paths.reJsonIndex(self.assembly),
                               "callback": "" })"""
            _ret = self.cache.alltop()
       
        if "hits" in _ret:
            try:
                return self._process_tree_hits(j, _ret)
            except:
                raise
                print("ERROR in ajaxws: _tree")
                pass
        return {"results": {"tree": {"tree": None, "labels": []}}}

    def _process_tree_hits(self, j, _ret):
        results = {}
        biosampleTypes = self.cache.biosamples.biosampleTypes()
        for typ in biosampleTypes:
            def ctFilter(ct):
                if not ct in self.cache.biosamples:
                    print("missing", ct)
                    return False
                return typ == self.cache.biosamples[ct].biosample_type
            print("!correlating")
            with Timer(typ + ": spearman correlation time"):
                c = Correlation(_ret["hits"]["hits"])
                if self.assembly == "hg19":
                    labels, corr = c.spearmanr(j.get("outer", "dnase"),
                                               j.get("inner", None),
                                               ctFilter )
                else:
                    labels, corr = c.pearsonr(j.get("outer", "dnase"),
                                              j.get("inner", None),
                                              ctFilter )
                    print("!got correlation")
            if not labels:
                continue
            rho, pval = corr
            print(len(rho))
            print(len(rho[0]) if len(rho) > 0 else "")
            return {"results": {"tree": None, "tree_title": title}}

            try:
                rhoList = rho.tolist() if type(rho) is not list else rho
                _heatmap = Heatmap(rhoList)
            except:
                print("rho", rho)
                print("pval", pval)
                continue
            with Timer(typ + ": hierarchical clustering time"):
                roworder, rowtree = _heatmap.cluster_by_rows()
            results[typ] = {"tree": rowtree, "labels": labels}

        title = ' / '.join([x for x in
                             [j.get("outer", "dnase"), j.get("inner", None)]
                             if x])
        return {"results": {"tree": results,
                            "tree_title" : title }}

    def _search(self, j, fields = _default_fields, callback = "regulatory_elements"):
        # http://stackoverflow.com/a/27297611
        j["object"]["_source"] = fields
        j["callback"] = callback
        j["object"]["sort"] = [{ "neg-log-p": "desc" }]

        if "post_processing" in j: # not present in cart
            if "rank_heatmap" in j["post_processing"]:
                j["object"]["aggs"] = self.rh.aggs
                if "bool" not in j["object"]["query"]:
                    j["object"]["query"]["bool"] = {"must": []}
                if "must" not in j["object"]["query"]["bool"]:
                    j["object"]["query"]["bool"]["must"] = []
                if "filter" in j["object"]["query"]["bool"]:
                    j["object"]["query"]["bool"]["must"] += j["object"]["query"]["bool"]["filter"]
                j["object"]["query"]["bool"]["must"].append(j["object"]["post_filter"])
                j["object"].pop("post_filter", None)
                j["object"]["query"]["bool"].pop("filter", None)
                j["callback"] = ""

        with Timer('ElasticSearch time'):
            ret = self._query({"object": j["object"],
                               "index": paths.reJsonIndex(self.assembly),
                               "callback": j["callback"] })
        if "post_processing" in j:
            if "tss_bins" in j["post_processing"]:
                tss = TSSBarGraph(ret["aggs"][j["post_processing"]["tss_bins"]["aggkey"]])
                ret["tss_histogram"] = tss.format()
            if "rank_heatmap" in j["post_processing"] and self.assembly != "mm10":
                ret["rank_heatmap"] = self.rh.process(ret)
            if "venn" in j["post_processing"]:
                ret["venn"] = self._run_venn_queries(j["post_processing"]["venn"], j["object"])

        if self.args.dump:
            self._dump(j, ret)
        return ret

    def _dump(self, j, ret):
        base = Utils.timeDateStr() + "_" + Utils.uuidStr() + "_partial"
        for prefix, data in [("request", j), ("response", ret)]:
            fn = base + '_' + prefix + ".json"
            fnp = os.path.join(os.path.dirname(__file__), "../../tmp/", fn)
            Utils.ensureDir(fnp)
            with open(fnp, 'w') as f:
                json.dump(data, f, sort_keys = True, indent = 4)
            print("wrote", fnp)

    def beddownload(self, j, uid):
        try:
            if "action" in j and "search" == j["action"]:
                ret = self.downloadAsBed(j, uid)
                return ret
            else:
                return { "error" : "unknown action"}
        except:
            raise
            return { "error" : "error running action"}

    def jsondownload(self, j, uid):
        try:
            if "action" in j and "search" == j["action"]:
                ret = self.downloadAsJson(j, uid)
                return ret
            else:
                return { "error" : "unknown action"}
        except:
            raise
            return { "error" : "error running action"}

    def downloadFileName(self, uid, formt):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        outFn = '-'.join([timestr, "v4", formt]) + ".zip"
        outFnp = os.path.join(self.staticDir, "downloads", uid, outFn)
        Utils.ensureDir(outFnp)
        return outFn, outFnp

    def downloadAsSomething(self, uid, j, formt, writeFunc):
        ret = self._query({"object": j["object"],
                           "index": paths.reJsonIndex(self.assembly),
                           "callback": "regulatory_elements" })
        outFn, outFnp = self.downloadFileName(uid, formt)

        data = writeFunc(ret["results"]["hits"])

        with open(outFnp, mode='w') as f:
            f.write(data)

        print("wrote", outFnp)

        url = os.path.join('/', "static", "downloads", uid, outFn)
        return {"url" : url}

    def downloadAsBed(self, j, uid):
        rankTypes = {"ctcf" : ["CTCF-Only", "DNase+CTCF"],
                     "dnase": [],
                     "enhancer": ["DNase+H3K27ac", "H3K27ac-Only"],
                     "promoter": ["DNase+H3K4me3", "H3K4me3-Only"]}

        def writeBedLine(rank, subRank, ct, cre):
            re = cre["_source"]
            pos = re["position"]
            if "dnase" == rank:
                r = re["ranks"][rank][ct]
                signal = r["signal"]
            else:
                if subRank in re["ranks"][rank][ct]:
                    r = re["ranks"][rank][ct][subRank]
                    signalKeys = [x for x in r.keys() if x != "rank"]
                    signalValues = [r[x]["signal"] for x in signalKeys]
                    signal = np.mean(signalValues)
                else:
                    return None
            rankVal = r["rank"]
            signal = round(signal, 2)

            score = int(Utils.scale(rankVal, (1, 250 * 100), (1000, 1)))
            toks = [pos["chrom"], pos["start"], pos["end"], re["accession"],
                    score, '.', signal, re["neg-log-p"], -1, -1]
            return "\t".join([str(x) for x in toks])

        def writeBed(rank, subRank, ct, rows):
            f = StringIO.StringIO()
            for re in rows:
                line = writeBedLine(rank, subRank, ct, re)
                if not line:
                    return None
                f.write(line  + "\n")
            return f.getvalue()

        def writeBeds(rows):
            mf = StringIO.StringIO()
            with zipfile.ZipFile(mf, mode='w',
                                 compression=zipfile.ZIP_DEFLATED) as zf:
                for rank, subRanks in rankTypes.iteritems():
                    cts = rows[0]["_source"]["ranks"][rank].keys()
                    if "dnase" == rank:
                        for ct in cts:
                            data = writeBed(rank, [], ct, rows)
                            ct = Utils.sanitize(ct)
                            fn = '.'.join([rank, ct, "bed"])
                            if data:
                                zf.writestr(fn, data)
                    else:
                        for subRank in subRanks:
                            for ct in cts:
                                data = writeBed(rank, subRank, ct, rows)
                                ct = Utils.sanitize(ct)
                                fn = '.'.join([rank, subRank, ct, "bed"])
                                if data:
                                    zf.writestr(fn, data)
            return mf.getvalue()
        return self.downloadAsSomething(uid, j, "beds", writeBeds)

    def downloadAsJson(self, j, uid):
        def writeJson(rows):
            mf = StringIO.StringIO()
            with zipfile.ZipFile(mf, mode='w',
                                 compression=zipfile.ZIP_DEFLATED) as zf:
                for cre in rows:
                    re = cre["_source"]
                    data = json.dumps(re) + "\n"
                    zf.writestr(re["accession"] + '.json', data)
            return mf.getvalue()
        return self.downloadAsSomething(uid, j, "jsons", writeJson)
