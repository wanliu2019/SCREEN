import React from 'react';

import * as ApiClient from '../../../common/api_client';

export const intro = () => (
    <p>
        The ENCODE Encyclopedia comprises two levels of epigenetic annotations (<b>Figure 1</b>). The ground level includes peaks and quantifications produced by the ENCODE uniform processing pipelines for individual data types.  The integrative level contains annotations generated by integrating multiple ground-level annotations. The core of the integrative level is the Registry of candidate cis-Regulatory Elements (cCREs), and SCREEN is a web-based visualization engine designed specifically for the Registry. SCREEN allows the user to explore ccREs and investigate how these elements relate to other annotations in the Encyclopedia, as well as raw ENCODE data where informative.
    </p>);

export const registry1 = () => (
    <p>
	The cCREs in the Registry are the subset of representative DNase hypersensitivity sites (rDHSs; <b>Figure 2</b>) with epigenetic activity further supported by histone modification (H3K4me3 and H3K27ac) or CTCF-binding data. We derive the rDHSs from of 449 DNase-seq datasets in human and 62 DNase-seq datasets in mouse. Raw DHSs are called from these datasets using the <a href="https://www.encodeproject.org/search/?type=Experiment&internal_tags=ENCYCLOPEDIAv4&assay_slims=DNA+accessibility&assembly=hg19&files.file_type=bed+broadPeak" target="_blank" rel="noopener noreferrer">HOTSPOT2</a> algorithm, and the DHSs are condensed into rDHSs using <a href="https://www.ncbi.nlm.nih.gov/pubmed/22576172" target="_blank" rel="noopener noreferrer">Bedops</a> and a custom script by the Stam lab (<a href="https://github.com/Jill-Moore/ENCODE3/blob/master/Registry-of-ccREs/Create-Registry/Create-rDHSs.sh" target="_blank" rel="noopener noreferrer">GitHub</a>) as follows. The DHSs number &#126;73 M in human and &#126;13.8 M in mouse at a false discovery rate (FDR) &#60; 5&#37; (<b>Figure 2</b>), and we further filter these to an FDR threshold of 0.1&#37;. We iteratively cluster these DHSs across all experiments and select the DHS with the highest signal—measured in Z-score—as the rDHS for each cluster. To compute Z-scores, we first quantify the DNase signal for each DHS, which is the average number of DNase-seq reads across all nucleotide positions within the DHS, and then calculate the mean and standard deviation of DNase signals across all DHSs in each experiment. The iterative clustering and selection process continue until it finally results in a list of non-overlapping rDHSs representing all DHSs, numbering 2,115,300 for human and 1,036,226 for mouse (<b>Figure 3</b>). We filter out rDHSs with Z-scores less than 1.64—a threshold corresponding to the 95th percentile of a one-tailed test—yielding 1,661,868 human and 628,352 mouse rDHSs (<b>Figure 3</b>).
    </p>);

export const registry2 = () => (
    <p>
	We asked whether each rDHS was supported by H3K4me3, H3K27ac, and CTCF ChIP-seq signals. Each ChIP-seq experiment has a control (called the input), and most ENCODE ChIP-seq experiments have two biological replicates. We defined the signal as the log-fold-change between the ChIP reads and input reads at each genomic position, combining reads from both biological replicates if available. The log-fold-changes were computed using ENCODE uniform processing pipelines, one pipeline for histone marks and another for transcription factors. We calculated the average CTCF signal across all the genomic positions of each rDHS for every cell type with available data, and we performed the same calculation for H3K4me3 and H3K27ac after extending the rDHS on both ends by ±500 bp, because DHSs are typically nucleosome depleted and the histone marks reside on the nucleosomes flanking the rDHS. To enable comparison of signals across different experiments, we transformed these average signals to Z-scores by calculating the mean and standard deviation across all rDHSs for each histone mark or CTCF ChIP-seq experiment. 
    </p>);

export const registry3 = () => (
    <p>
        The subset of rDHSs with support from at least one additional type of epigenetic signal are designated cCREs, i.e., the rDHSs with high H3K4me3, H3K27ac, or CTCF-binding signals (high signal is defined as Z-score > 1.64) in at least one cell type. We abbreviate the maximal Z-score for a data type across all cell types with ENCODE and Roadmap data as the data type’s max-Z. Thus ccREs are rDHSs with DNase max-Z > 1.64 AND (H3K4me3 max-Z > 1.64 OR H3K27ac max-Z > 1.64 OR CTCF max-Z > 1.64). In total, there are 1,310,152 human ccREs and 431,202 mouse ccREs (<b>Figure 3</b>). Among them, 724,590 human ccREs and 228,027 mouse ccREs have high DNase and high H3K4me3, H3K27ac, or CTCF in the same cell type; these ccREs are further designated as having "concordant" support and are marked with a blue star in SCREEN.
    </p>);

export const classif1 = () => (
        <p>
	    In analogy with the GENCODE catalog of genes, which are defined irrespective of their varying expression levels and alternative transcripts across different cell types, we provide a general, cell type-agnostic classification of cCREs based on the max-Zs. With the H3K4me3, H3K27ac, or CTCF max-Zs values being either high (&ge; 1.64) or low (&lt; 1.64), a ccRE can adopt one of eight states. Furthermore, each ccRE is classified as being proximal (&le; 2 kb) or distal (&gt; 2 kb) to the nearest GENCODE annotated TSS. We further combine some of the aforementioned states into three broader mutually-exclusive groups (<b>Figure 3</b>): 
        </p>);

export const classif2 = () => (
    <ol type="1">
	<li>cCREs with promoter-like signatures (ccRE-PLS) must have high H3K4me3 max-Zs. If they are TSS-distal, they must also have low H3K27ac max-Zs.</li>
	<li>cCREs with enhancer-like signatures (ccRE-ELS) must have high H3K27ac max-Zs. If they are TSS-proximal, they must also have low H3K4me3 max-Zs.</li>
	<li>CTCF-only cCREs are the remaining ccREs. They do not fall into either of the first two categories and thus by definition must have high CTCF max-Zs to qualify as ccREs.</li>
    </ol>);

export const classif3 = () => (
    <p>
	In addition to the cell type-agnostic classification described above, we evaluated the biochemical activity of each cCRE in each individual cell type using the corresponding DNase, H3K4me3, H3K27ac, and CTCF data. All ccREs with low DNase Z-scores in a particular cell type are bundled into one &ldquo;inactive&rdquo; state for that cell type; the remaining &ldquo;active&rdquo; ccREs are divided into eight states according to their epigenetic signal Z-scores, producing nine possible states in total. The three groups described above&mdash;ccRE-PLS, ccRE-ELS, and CTCF-only ccRE&mdash;apply to the active ccREs within a particular cell type. Two additional groups are defined with respect to individual cell types: an "inactive" group, containing all ccREs in the inactive state, and a DNase-only group, containing ccREs with high DNase Z-scores but low H3K4me3, H3K27ac, and CTCF Z-scores within the cell type. Importantly, while the classification tree in Figure 3 places each ccRE into only one activity group, the signal strengths for all recorded epigenetic features are retained for each ccRE in the Registry, and these can be used for customized searches by users, as explained below.
    </p>);

export const genomicFootprint = () => (
    <p>
	We analyzed the percentage of the genome covered by each group of cCREs, considering only regions of the genome which are mappable by 36-nt long sequences in DNase-seq experiments (~2.65 billion bases for human and 2.29 billion bases for mouse). In total, 20.8% of the mappable genome is covered by ccREs (4.2% by ccREs-PLS, 15.9% by ccREs-ELS, and 0.7% by CTCF-only ccREs) and 8.8% of the mappable mouse genome is covered by ccREs (<b>Figure 4</b>). The lower coverage for mouse is due to the smaller number of cell types with data to define ccREs.
    </p>)

export const comprehensiveness1 = () => (
    <p>
	In defining the registry of cCREs based on rDHSs, we have assumed that the existing collection of rDHSs distilled from hundreds of DNase-seq experiments can accurately represent ccREs in all cell types. In other words, we assume that all cell types, including those without DNase-seq data, use a subset of the ccREs in the registry as their regulatory landscape. To test this hypothesis, we set out to assess the comprehensiveness of the Registry in three ways.
    </p>);
export const comprehensiveness2 = () => (
    <p>
	First, we examined how many of the GENCODE-annotated TSSs (V19 for human and M4 for mouse) were covered by the current version of the Registry of cCREs. For human, 67% of all annotated TSSs and 72% of the TSSs of protein-coding genes are within 2kb of a ccRE in the Registry. For mouse, 61% of all annotated TSSs and 66% of the TSSs of protein-coding genes are within 2 kb of a ccRE in the Registry.
    </p>);
export const comprehensiveness3 = () => (
    <p>
	Second, we analyzed how rapidly the total number of unique rDHSs saturated with more and more cell types. We modeled rDHS saturation using a Weibull distribution and the results indicate that and 78.9% and 73.5% of rDHSs with FDR&lt;0.1% and Z-score&gt;1.64 have been identified in human and mouse respectively.
    </p>);
export const comprehensiveness4 = () => (
    <p>
	Third, we computed the Registry&#39;s coverages of H3K27ac, H3K4me3, and CTCF peaks&nbsp;(FDR&lt;0.01) of cell types with the corresponding ChIP-seq data but without DNase-seq data (<b>Figure 5</b>). The Registry covers 87&plusmn;5% of H3K27ac, 90&plusmn;8% of H3K4me3 and 99&plusmn;0.8% of CTCF peaks. The coverage was equally high for mouse, despite a smaller number of DNase-seq experiments for building the mouse Registry: 88&plusmn;5% of H3K27ac peaks (69 tissue&ndash;time-points) and 96&plusmn;8% of H3K4me3 peaks (74 tissue&ndash;time-points) were accounted for. (There are no cell types with CTCF ChIP-seq data but no DNase-seq data.)
    </p>);

export const genomicContext = () => (
    <p>
	Using GENCODE V19 annotations, we find that 18.5% of human cCREs (<b>Figure 6</b>) are proximal (&plusmn;2 kb) to annotated GENCODE transcription start sites (TSSs) while the majority of ccREs are distal from TSSs and lie in introns (45.0%) or intergenic regions (32.7%). A similar distribution is observed in mouse, with 20.1% of ccREs proximal to annotated TSSs, 39.7% lie within introns and 35.7% fall in intergenic regions. We annotated each ccRE with nearby genomic elements, including genes and their expression levels, single nucleotide polymorphisms (SNPs), and elements within the same topologically associated domains (TADs). These annotations can be found for each ccRE on the <i>Nearby Genomic Features</i> tab of the <i>ccRE Details</i> page.
    </p>);

export const occupancy1 = () => (
    <p>
	In addition to the four core epigenomic marks used to generate the Registry, we also annotate each cCRE using all available ChIP-seq data for other histone modifications and transcription factors. Specifically, we intersected each ccRE with all available histone mark and TF ChIP-seq peaks, identified using ENCODE uniform processing pipelines. We display these results in the <i>TF and His-mod Intersection</i> tab of the <i>Details</i> page.
    </p>);

export const gwas1 = () => (
    <div>
        <p>Using the <a href="https://www.ebi.ac.uk/gwas/" target="_blank" rel="noopener noreferrer">NHGRI-EBI GWAS Catalog</a>, we selected studies with the following requirements:
        </p>
        <ul>
            <li>Study must be performed on single population, because mixed populations complicate linkage disequilibrium (LD) structures.
            </li>
            <li>For the time being, we are curating only study that use only subjects from CEU (caucasian-european) population, because we use population-specific LD data to perform statistical tests. We plan to include other populations in the near future.
            </li>
        </ul>
        <p>
            For each study, we downloaded all reported SNPs, even those that were just under genome wide significance.
        </p>
    </div>)

export const gwas2 = () => (
    <div>
        <p>
For each study, we created a control set of SNPs accounting for minor allele frequencies (in CEU population) and distance from transcription start sites (TSS) using SNPs from SNP-Chip arrays. This method was adapted and modified from the <a href="https://github.com/robertkleinlab/uesEnrichment" target="_blank" rel="noopener noreferrer">Uncovering Enrichment through Simulation (UES)</a> method developed by the Klein Lab (Hayes <i>et al.</i> 2015). For each GWAS tagged SNP we generated 100 matched controls. For both GWAS SNPs and control SNPs we also included all SNPs in LD with them (default r<sup>2</sup> &gt; 0.7).
        </p>

        <p>
Using all GWAS SNPs + LD and Control SNPs + LD we then intersected the SNPs with cCREs. For cell-type-specific enrichment, we required the ccRE to have a H3K27ac Z-score of 1.64 in that cell type. After pruning for LD, (i.e. only counting one cell-type-specific ccRE per LD block) we used Fisher&#39;s exact test to determine if the GWAS SNPs were enriched in the ccRE specific to each cell type. We are in the process of calculating cell type enrichment based on ccREs with a DNase Z-score above 1.64 in that cell type.
        </p>
    </div>)

export const citation = () => (
    <ul>
        <li>ENCODE Project Consortium, Bernstein BE, Birney E, Dunham I, Green ED, Gunter C, Snyder M. 2012. An integrated encyclopedia of DNA elements in the human genome. <i>Nature</i> 489: 57–74.</li>
        <li>ENCODE Project Consortium, Myers RM, Stamatoyannopoulos J, Snyder M, Dunham I, Hardison RC, Bernstein BE, Gingeras TR, Kent WJ, Birney E, et al. 2011. A user's guide to the encyclopedia of DNA elements (ENCODE). <i>PLoS Biol</i> 9: e1001046.</li>
    </ul>)

export const figure = (num, alt, style = {}) => {
    const imgSrc = "/about/images/figure" + num + ".png";
    return (
        <div className={"panel panel-default"}>
            <div className="panel-body">
                <figure className={"figure"}>
	            <img src={ApiClient.StaticUrl(imgSrc)}
                         className={"figure-img img-fluid rounded img-responsive"}
                         alt={alt}
	                 style={style}
                    />
                    <figcaption className={"figure-caption"}>
                        <b>Figure {num}</b>
                    </figcaption>
                </figure>
            </div>
        </div>);
}
