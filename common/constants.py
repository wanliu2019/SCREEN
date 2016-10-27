#!/usr/bin/env python

from __future__ import print_function

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from files_and_paths import Dirs
from v4_config import V4Config

chroms = {"hg19": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2', 'chr20', 'chr21', 'chr22',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrX', 'chrY'], #'chrM'
          "mm10": ['chr1', 'chr10', 'chr11', 'chr12', 'chr13',
                   'chr14', 'chr15', 'chr16', 'chr17', 'chr18',
                   'chr19', 'chr2',
                   'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8',
                   'chr9', 'chrM', 'chrX', 'chrY'] }

class paths:
    v4d = os.path.join(Dirs.encyclopedia, "Version-4")

    def insChr(fnp):
        def addChr(chrom):
            toks = fnp.split(".")
            return "%s.%s.%s" % (toks[0], chrom, ".".join(toks[1:]))
        return addChr

    re_json_vers = { 6: {"origFnp": insChr(os.path.join(v4d, "ver6/regulatory-element-registry-hg19.V6.json.gz")),
                         "rewriteFnp": insChr(os.path.join(v4d, "ver6/regulatory-element-registry-hg19.V6.mod.json._tmp.gz")),
                         "re_bed": os.path.join(v4d, "ver6/regulatory-element-registry-hg19.V6.bed.gz"),
                         "index": "regulatory_elements_6"},
                     7: {"origFnp": insChr(os.path.join(v4d, "ver7/regulatory-element-registry-hg19.V7.json.gz")),
                         "rewriteGeneFnp": insChr(os.path.join(v4d, "ver7/regulatory-element-registry-hg19.V7.mod.gene.json.gz")),
                         "rewriteGenePeaksFnp": insChr(os.path.join(v4d, "ver7/regulatory-element-registry-hg19.V7.mod.gene.peaks.json.gz")),
                         "re_bed": os.path.join(v4d, "ver7/regulatory-element-registry-hg19.V7.bed.gz"),
                         "accIntersections": os.path.join(v4d, "ver7/accessionsAndIntersections.json"),
                         "bedLsjFnp" : os.path.join(v4d, "ver7/beds.lsj"),
                         "index": "regulatory_elements_7"}
                     }

    @staticmethod
    def get_paths(version, chrs = None):
        ret = {}
        if version not in paths.re_json_vers: return ret
        for k, v in paths.re_json_vers[version].iteritems():
            if not hasattr(v, "__call__"):
                ret[k] = v
            else:
                ret[k] = [v(chrom) for chrom in chrs]
        return ret

    hexplots_dir = os.path.join(v4d, "hexplots")
    gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff")}

    genelist = {"hg19" : os.path.join(v4d, "genelist.hg19.tsv")}
    genelsj = {"hg19" : os.path.join(v4d, "genelist.hg19.lsj")}
    geneJsonFnp = {"hg19" : os.path.join(v4d, "genelist.hg19.json")}

    genedb = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.json.gz")
    genedb_lsj = os.path.join(v4d, "geneid_genename_with_tpmallrep_fpkmallrep.V19.hg19.lsj.gz")
    snp_csvs = [("mm10", os.path.join(Dirs.dbsnps, "snps142common.mm10.csv")),
                ("hg19", os.path.join(Dirs.dbsnps, "snps144common.hg19.csv"))]
    snp_lsj = os.path.join(v4d, "snplist.lsj.gz")

    re_json_index = "regulatory_elements_7"

    cellTypeTissueTable = "cellTypesAndTissues"

def main():
    fnps = paths.get_paths(7, chroms["hg19"])

    inFnps = fnps["rewriteGeneFnp"]
    for fnp in inFnps:
        print(fnp)

if __name__ == '__main__':
    sys.exit(main())
