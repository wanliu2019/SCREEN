#pragma once

namespace SCREEN {

  struct region {
    uint  start;
    uint  end;
    float score;
  };

  std::string regionToString(region);

  class RegionSet {

  private:
    std::unordered_map<std::string, std::vector<region>> regions_;
    void _append(const std::string&, int, float);

  public:
    RegionSet();
    RegionSet(std::unordered_map<std::string, std::vector<region>>);

    void appendRegionSet(const RegionSet&);
    void appendNarrowPeak(const boost::filesystem::path&, float = 0.05);
    void appendNarrowPeak(const std::string&, float = 0.05);
    void appendZ(const boost::filesystem::path&);
    void appendZ(const std::string&);

    const std::vector<region> &operator [](std::string &);
    const std::unordered_map<std::string, std::vector<region>> &regions() const;
    
    size_t total();
    void sort();
    RegionSet rDHS_Cluster();
    void write_binary(const std::string&, const boost::filesystem::path&);
    void read_binary(const std::string&, const boost::filesystem::path&);
    void write(const boost::filesystem::path&);

  };

} // SCREEN
