#include <boost/filesystem.hpp>
#include <boost/filesystem/operations.hpp>

#include "paths.hpp"

namespace SCREEN {
  bfs::path Paths::root() const { return root_; }

  bfs::path Paths::rDHS_list() const {
    return root_ / "rDHS.bed";
  }

  bfs::path Paths::hotspot_list() const {
    return root_ / "Hotspot-List.txt";
  }

  bfs::path Paths::DHS_ZScore_root(const std::string &dataset) const {
    return root_ / "DHS" / dataset;
  }

  bfs::path Paths::DHS_ZScore(const std::string &accession,
			      const std::string &dataset) const {
    return DHS_ZScore_root(dataset) / (accession + ".zscore.bed");
  }

  bfs::path Paths::CTS_root() const {
    return root_ / "CTS";
  }

  bfs::path Paths::CTS(const std::string &accession) const {
    return CTS_root() / (accession + ".zscore.bed");
  }

  bfs::path Paths::CTA() const {
    return root_ / "CTA.bed";
  }

  bfs::path Paths::saturation() const {
    return root_ / "saturation.tsv";
  }
  
  bfs::path Paths::cistromeList() const {
    return "/data/projects/cREs/mm10/cistrome_list.txt";
  }
  
  bfs::path Paths::EncodeData(const std::string& expID, const std::string& fileID,
			      const std::string& ext) const{
    return bfs::path("/data/projects/encode/data/") / expID / (fileID + ext);
  }
  
} // SCREEN