#!/usr/bin/env python

from __future__ import print_function
import os, sys, json

from compute_gene_expression import Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import Autocompleter
from constants import paths, PageTitle, chrom_lengths
from pg import PGsearch
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Timer
from db_utils import getcursor

class CachedObjectsWrapper:
    def __init__(self, ps):
        self.cos = {"hg19" : CachedObjects(ps, "hg19"),
                    "mm10" : CachedObjects(ps, "mm10")}

    def __getitem__(self, assembly):
        return self.cos[assembly]

class CachedObjects:
    def __init__(self, ps, assembly):
        self.ps = ps
        self.pgSearch = PGsearch(ps, assembly)
        self.assembly = assembly

        with Timer("load CachedObjects " + assembly) as t:
            self._load()

    def _load(self):
        self.chromCounts = self.pgSearch.chromCounts()
        self.creHist = self.pgSearch.creHist()

        self.tf_list = self.pgSearch.tfHistoneDnaseList()

        self.datasets = Datasets(self.assembly, self.pgSearch)

        self.rankMethodToCellTypes = self.pgSearch.rankMethodToCellTypes()
        self.rankMethodToIDxToCellType = self.pgSearch.rankMethodToIDxToCellType()
        self.biosampleTypes = self.datasets.biosample_types
        self.assaymap = {"dnase": self.pgSearch.datasets("DNase"),
                         "h3k27ac": self.pgSearch.datasets("H3K27ac"),
                         "h3k4me3": self.pgSearch.datasets("H3K4me3"),
                         "ctcf" : self.pgSearch.datasets("CTCF")}
        self.ensemblToSymbol, self.ensemblToStrand = self.pgSearch.genemap()

        self.geBiosampleTypes = self.pgSearch.geBiosampleTypes()

        self.geneIDsToApprovedSymbol = self.pgSearch.geneIDsToApprovedSymbol()

    def lookupEnsembleGene(self, s):
        name = self.ensemblToSymbol.get(s, '')
        strand = self.ensemblToStrand.get(s, '')
        if strand:
            return name, strand

        d = s.split(".")[0]
        name = self.ensemblToSymbol.get(d, '')
        strand = self.ensemblToStrand.get(d, '')
        if strand:
            return name, strand

        if name:
            return name, ''
        return s, ''

    def global_data(self, ver):
        datasets = self.datasets
        return {
            "tfs" : self.tf_list,
            "cellCompartments" : Compartments,
            "cellTypeInfoArr": datasets.globalCellTypeInfoArr,
            "chromCounts" : self.chromCounts,
            "chromLens" : chrom_lengths[self.assembly],
            "creHistBins" : self.creHist,
            "byCellType" : datasets.byCellType,
            "geBiosampleTypes" : self.geBiosampleTypes
        }

    def assayAndCellTypeToExpAndBigWigAccessions(self, assay, ct):
        return self.assaymap[assay][ct]

def main():
    DBCONN = db_connect(os.path.realpath(__file__), True)

    ps = PostgresWrapper(DBCONN)
    cache = CachedObjects(ps, "mm10")
    pgSearch = PGsearch(ps, "mm10")

    n = pgSearch.datasets("DNase")

    for k, v in cache.assaymap["dnase"].iteritems():
        print(k, v, n[k])

if __name__ == '__main__':
    main()
