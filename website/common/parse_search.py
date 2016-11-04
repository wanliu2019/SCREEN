#!/usr/bin/env python

#import nltk
#sentence = """At eight o'clock on Thursday morning  Arthur didn't feel very good."""
#tokens = nltk.word_tokenize(sentence)
#print tokens

from coord import Coord

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ParseSearch:
    def __init__(self, rawInput, es):
        self.es = es
        self.rawInput = rawInput

        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = "hg19"

    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]

    def parseStr(self):
        return self.sanitizedStr

    def find_celltypes_in_query(self, q):
        return self.es.cell_type_query(q)
    
    def parse(self, comparison = False):
        s = self._sanitize()
        self.sanitizedStr = s
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = None
        cellTypes = self.find_celltypes_in_query(s)
        ret = {"cellType": None if len(cellTypes) == 0 else cellTypes[0].replace(" ", "_"), "coord" : None, "range_preset": None}

        gene_suggestions, gene_results = self.es.gene_aliases_to_coordinates(s)
        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
        snp_suggestions, snp_results = self.es.snp_aliases_to_coordinates(s)
        snp_toks, snp_coords = _unpack_tuple_array(snp_results)
        accessions = []

        if len(snp_coords) > 0:
            coord = Coord.parse(snp_coords[-1])
            coord.resize(self.halfWindow)
        if len(gene_coords) > 0:
            coord = Coord.parse(gene_coords[-1])
        
        try:
            for t in toks:
                print(t)
                if t.startswith("chr"):
                    # coordinate
                    coord = Coord.parse(t)
                    continue
                elif t.startswith("ee"):
                    accessions.append(t)
                    continue
        except:
            raise
            print("could not parse " + s)

        print(gene_coords)

        if "promoter" in toks:
            ret["range_preset"] = "promoter"
        elif "enhancer" in toks:
            ret["range_preset"] = "enhancer"
        elif "insulator" in toks:
            ret["range_preset"] = "insulator"

        print(coord, ret["cellType"])
        if coord:
            ret.update({"coord": {"chrom": coord.chrom,
                                   "start": coord.start,
                                   "end": coord.end}})
        ret.update({"accessions": accessions})
        return ret
