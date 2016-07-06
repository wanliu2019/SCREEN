#!/usr/bin/env python

import nltk
#sentence = """At eight o'clock on Thursday morning  Arthur didn't feel very good."""
#tokens = nltk.word_tokenize(sentence)
#print tokens

from coord import Coord
from dbsnps import dbSnps
from genes import LookupGenes

class ParseSearch:
    def __init__(self, DBCONN, rawInput):
        self.rawInput = rawInput
        self.DBCONN = DBCONN
        self.dbSnps = dbSnps(DBCONN)
        self.genes = LookupGenes(DBCONN)
             
        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = "hg19"

        self.cellTypes = {"hela-s3" : "HeLa-S3",
                          "k562" : "K562",
                          "gm12878" : "GM12878"}
                
    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]
    
    def parse(self):
        s = self._sanitize()
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = None
        cellType = None

        try:
            for t in toks:
                print(t)
                if t in self.cellTypes:
                    cellType = self.cellTypes[t]
                    continue
                elif t.startswith("chr"):
                    # coordinate
                    coord = Coord.parse(t)
                    continue
                elif t.startswith("rs"):
                    coord = self.parseSnp(t)
                    continue
                else:
                    coord = self.parseGene(t)
        except:
            raise
            print("could not parse " + s)

        print(coord, cellType)
        ret = {"cellType" : None, "coord" : None}
        if cellType:
            ret.update({"cellType" : cellType})
        if coord:
            ret.update({"coord" : {"chrom" : coord.chrom,
                                   "start" : coord.start,
                                   "end" : coord.end}})
        return ret
        
    def parseSnp(self, t):
        snps = self.dbSnps.lookup(self.assembly, t)
        if not snps:
            return None

        if len(snps) > 1:
            # TODO: subselect?
            return None

        snp = snps[0]
        c = Coord(snp[0], snp[1], snp[2])
        c.resize(self.halfWindow)
        return c

    def parseGene(self, t):
        genes = self.genes.lookup(self.assembly, t)
        if not genes:
            genes = self.genes.fuzzy_lookup(self.assembly, t)
            if not genes:
                self.userErrMsg = "'{loci}' not found".format(loci=t)
            else:
                self.userErrMsg = "'{loci}' not found; potential matches: {genes}".format(loci=t, genes=", ".join(sorted(genes)))
            return None

        if len(genes) > 1:
            self.userErrMsg = "Multiple genomic positions found; using first found..."
            return None

        gene = genes[0]
        c = Coord(gene[0], gene[1], gene[2])
        c.resize(self.halfWindow)
        return c
