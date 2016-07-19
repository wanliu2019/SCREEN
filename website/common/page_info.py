import sys, os, json
import subprocess

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from db_bed_overlap import DbBedOverlap

class PageInfoMain:
    def __init__(self, es, DBCONN, version, webSocketUrl):
        self.es = es
        self.DBCONN = DBCONN
        self.version = version
        self.regElements = RegElements(es)
        self.regElementDetails = RegElementDetails(es)
        self.webSocketUrl = webSocketUrl

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version,
                "webSocketUrl" : self.webSocketUrl}

    def hexplotPage(self, args, kwargs):
        retval = self.wholePage()
        retval["page"]["title"] = "hexplot view - Regulatory Element Visualizer"
        if len(args) < 1: return retval
        if "rankA" not in kwargs or "rankB" not in kwargs: return retval
        print(subprocess.check_output("ls", shell=True))
        fnps = [os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankA"], kwargs["rankB"])),
                os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankB"], kwargs["rankA"]))]
        print(fnps)
        for path in fnps:
            if os.path.exists(path):
                retval["imgpath"] = os.path.join("/%s" % self.version, "static", path.split("static/")[1])
                retval["page"]["title"] = "%s vs %s in %s - Regulatory Element Visualizer" % (kwargs["rankA"], kwargs["rankB"], args[0])
        retval["cell_line"] = args[0]
        retval["rankA"] = kwargs["rankA"]
        retval["rankB"] = kwargs["rankB"]
        return retval

    def searchPage(self, args, kwargs):
        retval = self.wholePage()

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse()

        facetlist = [{"id": "assembly",
                      "name": "assembly",
                      "type": "list",
                      "visible": True},
                     {"id": "cell_line",
                      "name": "cell types",
                      "type": "list",
                      "visible": True},
                     {"id": "chromosome",
                      "name": "chromosome",
                      "type": "list",
                      "visible": True},
                     {"id": "coordinates",
                      "name": "coordinates",
                      "type": "slider",
                      "label_text": "coordinates",
                      "visible": False} ]

        ranklist = [{"id": "dnase", "name": "DNase"},
                    {"id": "ctcf", "name": "CTCF"},
                    {"id": "promoter", "name": "promoter"},
                    {"id": "enhancer", "name": "enhancer"},
                    {"id": "conservation", "name": "conservation"}]

        retval.update({"parsed" : json.dumps(parsed),
                       "facetlist": facetlist,
                       "ranklist": ranklist,
                       "facetlist_json": json.dumps(facetlist),
                       "ranklist_json": json.dumps(ranklist) })

        return retval

    def rawQueryPage(self, q, url):
        pageinfo = self.wholePage()
        try:
            res = self.regElements.rawquery(q)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

    def queryPage(self, q):
        pageinfo = self.wholePage()
        try:
            suggestions, res = self.regElements.query(q)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res,
                         "suggestions": suggestions})
        return pageinfo

    def overlapPage(self, chrom, start, end):
        pageinfo = self.wholePage()
        try:
            res = self.regElements.overlap(chrom, start, end)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

    def reDetail(self, reAccession, kwargs):
        if not reAccession.startswith("EE"):
            return { "error" : "invalid accession"}

        try:
            res = self.regElementDetails.reFull(reAccession)
        except:
            return { "error" : "invalid read for " + reAccession }

        if not "hits" in res:
            return { "error" : "no hits for " + reAccession}

        hits = res["hits"]
        if len(hits["hits"]) > 1:
            return { "error" : "too many hits for " + reAccession }
        
        ret = {}
        ret["hit"] = hits["hits"][0]["_source"]

        return ret

    def rePeaks(self, reAccession, kwargs):
        try:
            re = self.reDetail(reAccession, kwargs)
        except:
            raise
            return {"error" : "could not lookup " + reAccession}
        
        if "error" in re:
            return re

        re = re["hit"]
        dbo = DbBedOverlap(self.DBCONN)
        pos = re["position"]
        expIDs = dbo.findBedOverlap(re["genome"],
                                    pos["chrom"],
                                    pos["start"],
                                    pos["end"])

        ret = {}
        ret["experiments"] = expIDs
        
        return ret

