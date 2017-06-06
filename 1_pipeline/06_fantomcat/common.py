import sys, os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../common"))
from constants import paths

class FCPaths:
    base = paths.fantomcat
    genetsv = os.path.join(base, "gene.info.tsv")
    genesdir = os.path.join(base, "genes")
    genebed = os.path.join(base, "gene.info.bed")
    intersected = os.path.join(base, "gene.info.intersected.bed")
    global_statistics = os.path.join(base, "global_statistics.json")
    cres = paths.path("hg19", "raw/cREs.sorted.bed.gz")

    @staticmethod
    def genepath(acc):
        return os.path.join(FCPaths.genesdir, acc + ".json")