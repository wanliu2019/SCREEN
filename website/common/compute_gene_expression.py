import sys, os, json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import random

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

TissueColors = {
    "blood": "#880000",
    "bone marrow": "#AACCAA",
    "brain": "#AA8888",
    "breast": "#33AA00",
    "colon": "#AAAA55",
    "embryonic structure": "#AAAAFF",
    "ESC": "#77FF44",
    "eye": "#6600CC",
    "fat": "#FFFF55",
    "heart": "#880055",
    "intestine": "#9900AA",
    "kidney": "#77AABB",
    "liver": "#884400",
    "lung": "#CCCCCC",
    "mammary": "#991111",
    "muscle": "#119911",
    "pancreas": "#AA88AA",
    "placenta": "#FF9977",
    "prostate": "#00AA88",
    "skin": "#BBAA44",
    "stomach": "#44AAFF",
    "uterus": "#990033",
    'adrenal gland' : "#BBAA44", 
    'blood vessel' : '#880000',
    'bone' : "#BBAA44",
    'bronchus' : "#BBAA44",
    'cartilage' : "#BBAA44",
    'connective tissue' : "#BBAA44",
    'esophagus' : "#BBAA44",
    'extraembryonic structure' : "#BBAA44",
    'gonad' : "#BBAA44",
    'iPSC' : "#BBAA44",
    'large intestine' : "#BBAA44",
    'lymphoid' : "#BBAA44",
    'mammary gland' : "#BBAA44",
    'mouth' : "#BBAA44",
    'muscle organ' : "#BBAA44",
    'myometrium' : "#BBAA44",
    'nervous system' : "#BBAA44",
    'olfactory organ' : "#BBAA44",
    'prostate gland' : "#00AA88",
    'skin of body' : "#BBAA44",
    'spinal cord' : "#BBAA44",
    'spleen' : "#BBAA44",
    'thyroid gland' : "#BBAA44",
    'trachea' : "#BBAA44",
    'urinary bladder' : "#BBAA44",
    'vagina' : "#BBAA44"
}

Compartments = ["cell", "nucleoplasm", "cytosol",
                "nucleus", "membrane", "chromatin", 
                "nucleolus"]

class ComputeGeneExpression:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache

        self.randColorGen = lambda: random.randint(0,255)
        self.tissueColors = {}

    def randColor(self):
        return '#%02X%02X%02X' % (self.randColorGen(),
                                  self.randColorGen(),
                                  self.randColorGen())

    def getTissueColor(self, t):
        if t not in self.tissueColors:
            self.tissueColors[t] = self.randColor()
        return self.tissueColors[t]
            
    def _filterNAs(self, rows):
        ret = []
        for row in rows:
            r = [row[0], row[1], row[2]]
            if '{}' == r[1]:
                r[1] = "na"
            ret.append(r)
        return ret

    def regroup(self, arr):
        ret = {}
        for e in arr:
            t = e["tissue"]
	    if t not in ret:
                c = "#000000"
                c = self.getTissueColor[t]
	        ret[t] = {"name" : e["tissue"],
                          "color": c, "items": []}
            ret[t]["items"].append(e)
        return ret

    def groupByTissue(self, rows):
        sorter = lambda x: x[1]
        rows.sort(key = sorter)

        ret = []
        for organ, subRows in groupby(rows, sorter):
            for row in subRows:
                ret.append({"cell_type" : row[2],
                            "rank" : float(row[0]),
                            "tissue" : organ})

        ret = self.regroup(ret)               
        return ret

    def sortHighToLow(self, rows):
        sorter = lambda x: float(x[0])
        rows.sort(key = sorter, reverse = True)

        arr = []
        for row in rows:
            arr.append({"cell_type" : row[2],
                        "rank" : float(row[0]),
                        "tissue" : row[1].strip()})

        ret = {}
        for idx, e in enumerate(arr):
            t = e["tissue"]
            c = self.getTissueColor(t)
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = {"name" : k,
                      "displayName" : t,
                      "color": c,
                      "items": [e]}
        return ret
    
    def computeHorBars(self, gene, compartments):
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute("""
            SELECT r.tpm, r_rnas.organ, r_rnas.cellType
            FROM r_expression AS r
            INNER JOIN r_rnas ON r_rnas.encode_id = r.dataset
            WHERE gene_name = %(gene)s
            AND r_rnas.cellCompartment IN %(compartments)s
            """,
                         { "gene" : gene,
                           "compartments" : tuple(compartments)})
            rows = curs.fetchall()

        rows = self._filterNAs(rows)

        #ret = self.groupByTissue(rows)
        ret = self.sortHighToLow(rows)
        return {"items" : ret }
    
